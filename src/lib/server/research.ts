import { buildResearchMemo } from "@/lib/research-memo";
import { deleteCache, getJsonCache, setJsonCache } from "@/lib/server/cache";
import { saveResearchMemo } from "@/lib/server/db";
import { getFmpResearchSnapshot, searchFmpSymbols } from "@/lib/server/fmp";
import { getResearchUniverse } from "@/lib/server/universe";
import { buildEvidence, computeScores, computeSignals } from "@/lib/signals";
import type { DashboardModel, Direction, EnrichedResearch } from "@/lib/types";

const snapshotCache = new Map<string, { expiresAt: number; value: EnrichedResearch }>();
const FIVE_MINUTES = 5 * 60 * 1000;
const RESEARCH_CACHE_SECONDS = 5 * 60;

export async function getSearchResults(query: string) {
  return searchFmpSymbols(query);
}

export async function getCompanyResearch(symbol: string): Promise<EnrichedResearch> {
  const normalized = symbol.toUpperCase();
  const cacheKey = `research:${normalized}`;
  const cached = snapshotCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const distributedCached = await getJsonCache<EnrichedResearch>(cacheKey);
  if (distributedCached) {
    snapshotCache.set(normalized, {
      expiresAt: Date.now() + FIVE_MINUTES,
      value: distributedCached
    });
    return distributedCached;
  }

  const snapshot = await getFmpResearchSnapshot(normalized);
  const evidence = buildEvidence(snapshot);
  const scores = computeScores(snapshot, evidence);
  const signals = computeSignals(snapshot, scores, evidence);
  const memo = await buildResearchMemo(snapshot, scores, signals, evidence);
  await saveResearchMemo(memo);
  const value = { snapshot, evidence, scores, signals, memo };

  snapshotCache.set(normalized, {
    expiresAt: Date.now() + FIVE_MINUTES,
    value
  });
  await setJsonCache(cacheKey, value, RESEARCH_CACHE_SECONDS);

  return value;
}

export async function refreshCompanyResearch(symbol: string): Promise<EnrichedResearch> {
  const normalized = symbol.toUpperCase();
  snapshotCache.delete(normalized);
  await deleteCache(`research:${normalized}`);
  return getCompanyResearch(normalized);
}

function averageCoreScore(scores: EnrichedResearch["scores"]) {
  const coreScores = scores.filter((score) =>
    ["quality", "valuation", "expectations"].includes(score.scoreType)
  );
  if (!coreScores.length) return 0;

  return Math.round(
    coreScores.reduce((sum, score) => sum + score.score, 0) / coreScores.length
  );
}

function researchIdeaFromModel({ snapshot, scores, signals }: EnrichedResearch) {
  const topSignal = signals[0];
  const coreScore = averageCoreScore(scores);
  const direction: Direction =
    topSignal?.direction ?? (coreScore >= 70 ? "positive" : coreScore >= 45 ? "mixed" : "neutral");

  return {
    symbol: snapshot.profile.symbol,
    title: topSignal?.title ?? "观察列表研究候选",
    thesis:
      topSignal?.summary ??
      "先复核公司页中的基本面、估值、预期、事件和行为披露，再决定是否建立 thesis。",
    direction,
    score: coreScore
  };
}

export async function getDashboardModel(): Promise<DashboardModel> {
  const universe = await getResearchUniverse(8);
  const research = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));

  return {
    generatedAt: new Date().toISOString(),
    marketPulse: [
      {
        label: "市场状态",
        value: "结构性偏风险",
        direction: "mixed",
        detail: "大市值高质量公司仍受资金关注，但估值分化明显。"
      },
      {
        label: "研究重点",
        value: "预期修正质量",
        direction: "positive",
        detail: "优先看 FMP 分析师预期和目标价变化，而不是只看新闻标题。"
      },
      {
        label: "事件压力",
        value: "中等",
        direction: "neutral",
        detail: "近期财报窗口和 SEC 文件是主要事件风险来源。"
      }
    ],
    universe,
    watchlist: research.map(({ snapshot, scores, signals }) => ({
      symbol: snapshot.profile.symbol,
      name: snapshot.profile.name,
      price: snapshot.quote.price,
      changePercent: snapshot.quote.changesPercentage,
      topSignal: signals[0]?.title ?? "暂无计算信号",
      score: averageCoreScore(scores)
    })),
    researchIdeas: research
      .map(researchIdeaFromModel)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((idea) => ({
        symbol: idea.symbol,
        title: idea.title,
        thesis: idea.thesis,
        direction: idea.direction
      }))
  };
}
