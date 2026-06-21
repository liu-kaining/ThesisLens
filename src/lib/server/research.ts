import { buildResearchMemo } from "@/lib/research-memo";
import { deleteCache, getJsonCache, setJsonCache } from "@/lib/server/cache";
import { getWatchlist, saveResearchMemo } from "@/lib/server/db";
import { getFmpResearchSnapshot, searchFmpSymbols } from "@/lib/server/fmp";
import { buildEvidence, computeScores, computeSignals } from "@/lib/signals";
import type { DashboardModel, EnrichedResearch } from "@/lib/types";

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

export async function getDashboardModel(): Promise<DashboardModel> {
  const watchlist = await getWatchlist();
  const symbols = watchlist.items.length
    ? watchlist.items.map((item) => item.symbol).slice(0, 8)
    : ["AAPL", "MSFT", "NVDA"];
  const research = await Promise.all(symbols.map((symbol) => getCompanyResearch(symbol)));

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
    watchlist: research.map(({ snapshot, scores, signals }) => ({
      symbol: snapshot.profile.symbol,
      name: snapshot.profile.name,
      price: snapshot.quote.price,
      changePercent: snapshot.quote.changesPercentage,
      topSignal: signals[0]?.title ?? "暂无计算信号",
      score: Math.round(
        scores
          .filter((score) => ["quality", "valuation", "expectations"].includes(score.scoreType))
          .reduce((sum, score) => sum + score.score, 0) / 3
      )
    })),
    researchIdeas: [
      {
        symbol: "MSFT",
        title: "高质量叠加预期动量",
        thesis:
          "利润率强、预期修正偏正，核心问题是估值纪律是否足够。",
        direction: "positive"
      },
      {
        symbol: "NVDA",
        title: "高增长与高预期并存",
        thesis:
          "thesis 取决于未来需求能否继续跑赢已经很高的市场预期。",
        direction: "mixed"
      },
      {
        symbol: "AAPL",
        title: "现金流稳健，但需要催化剂",
        thesis:
          "质量仍然稳健，但需要看到服务增长或硬件换机需求加速的证据。",
        direction: "mixed"
      }
    ]
  };
}
