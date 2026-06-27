import { buildResearchMemo } from "@/lib/research-memo";
import { stockSymbolSchema } from "@/lib/api-validation";
import {
  allDataModuleKeys,
  type DataModuleKey
} from "@/lib/data-modules";
import { deleteCache, getJsonCache, setJsonCache } from "@/lib/server/cache";
import { formatPercent } from "@/lib/format";
import {
  getCompanyResearchSnapshot,
  saveCompanyResearchSnapshot,
  saveResearchMemo,
  type PersistedResearchSnapshotRecord
} from "@/lib/server/db";
import { getFmpResearchSnapshot, searchFmpSymbols } from "@/lib/server/fmp";
import { enqueueDueDataSync } from "@/lib/server/sync-queue";
import { getResearchUniverse } from "@/lib/server/universe";
import { buildEvidence, computeScores, computeSignals } from "@/lib/signals";
import type { DashboardModel, Direction, EnrichedResearch, ResearchSnapshot } from "@/lib/types";

const snapshotCache = new Map<string, { expiresAt: number; value: EnrichedResearch }>();
const FIVE_MINUTES = 5 * 60 * 1000;
const RESEARCH_CACHE_SECONDS = 5 * 60;

function normalizeResearchSymbol(symbol: string) {
  const parsed = stockSymbolSchema.safeParse(symbol);
  if (!parsed.success) {
    throw new Error("Invalid U.S. stock symbol");
  }
  return parsed.data;
}

export async function getSearchResults(query: string) {
  return searchFmpSymbols(query);
}

async function buildEnrichedResearch(snapshot: ResearchSnapshot): Promise<EnrichedResearch> {
  const evidence = buildEvidence(snapshot);
  const scores = computeScores(snapshot, evidence);
  const signals = computeSignals(snapshot, scores, evidence);
  const memo = await buildResearchMemo(snapshot, scores, signals, evidence);

  return { snapshot, evidence, scores, signals, memo };
}

async function refreshStoredDerivedResearch(
  record: PersistedResearchSnapshotRecord
) {
  const recomputed = await buildEnrichedResearch(record.research.snapshot);
  if (recomputed.memo.factsHash === record.research.memo.factsHash) {
    return record.research;
  }

  await saveCompanyResearchSnapshot(recomputed);
  return recomputed;
}

function hasPersistableFmpData(snapshot: ResearchSnapshot) {
  if (snapshot.dataStatus.mode === "mock") return false;

  const modules = snapshot.dataStatus.modules ?? [];
  const liveModules = modules.filter((module) => module.status === "live").length;
  const companyQuoteIsLive = modules.some(
    (module) => module.key === "quote" && module.status === "live"
  );

  return companyQuoteIsLive || liveModules >= 2;
}

function withPersistedSnapshotWarning(record: PersistedResearchSnapshotRecord): EnrichedResearch {
  const warning = `FMP 当前刷新不可用，正在显示本地持久化快照；快照刷新时间 ${new Date(
    record.refreshedAt
  ).toLocaleString("zh-CN", { hour12: false })}。`;

  return {
    ...record.research,
    snapshot: {
      ...record.research.snapshot,
      dataStatus: {
        ...record.research.snapshot.dataStatus,
        mode: "mixed",
        warnings: [warning, ...record.research.snapshot.dataStatus.warnings.filter((item) => item !== warning)]
      }
    }
  };
}

async function persistResearchIfUseful(research: EnrichedResearch) {
  if (!hasPersistableFmpData(research.snapshot)) return false;

  await saveResearchMemo(research.memo);
  await saveCompanyResearchSnapshot(research);
  return true;
}

export async function getCompanyResearch(symbol: string): Promise<EnrichedResearch> {
  const normalized = normalizeResearchSymbol(symbol);
  const cacheKey = `research:${normalized}`;
  const cached = snapshotCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    await enqueueDueDataSync([normalized], 100, "page_access").catch(() => {
      // Cached reads should remain available if the queue is temporarily unavailable.
    });
    return cached.value;
  }

  const distributedCached = await getJsonCache<EnrichedResearch>(cacheKey);
  if (distributedCached) {
    await enqueueDueDataSync([normalized], 100, "page_access").catch(() => {
      // Cached reads should remain available if the queue is temporarily unavailable.
    });
    snapshotCache.set(normalized, {
      expiresAt: Date.now() + FIVE_MINUTES,
      value: distributedCached
    });
    return distributedCached;
  }

  const stored = await getCompanyResearchSnapshot(normalized);
  if (stored) {
    const storedResearch = await refreshStoredDerivedResearch(stored);
    await enqueueDueDataSync([normalized], 100, "page_access").catch(() => {
      // Serving a durable snapshot must not depend on queue availability.
    });
    snapshotCache.set(normalized, {
      expiresAt: Date.now() + FIVE_MINUTES,
      value: storedResearch
    });
    await setJsonCache(cacheKey, storedResearch, RESEARCH_CACHE_SECONDS);
    return storedResearch;
  }

  let value: EnrichedResearch;
  const cacheSeconds = RESEARCH_CACHE_SECONDS;

  try {
    const snapshot = await getFmpResearchSnapshot(normalized, {
      modules: ["profile", "quote"]
    });
    const freshResearch = await buildEnrichedResearch(snapshot);
    const persisted = await persistResearchIfUseful(freshResearch);

    if (persisted) {
      value = freshResearch;
      await enqueueDueDataSync([normalized], 100, "cold_page_access").catch(() => {
        // The next worker planning cycle will retry queueing deeper modules.
      });
    } else {
      value = freshResearch;
    }
  } catch (error) {
    throw error;
  }

  snapshotCache.set(normalized, {
    expiresAt: Date.now() + cacheSeconds * 1000,
    value
  });
  await setJsonCache(cacheKey, value, cacheSeconds);

  return value;
}

export async function refreshCompanyResearch(
  symbol: string,
  modules: DataModuleKey[] = allDataModuleKeys()
): Promise<EnrichedResearch> {
  const normalized = normalizeResearchSymbol(symbol);
  snapshotCache.delete(normalized);
  await deleteCache(`research:${normalized}`);
  const stored = await getCompanyResearchSnapshot(normalized);
  const effectiveModules = stored ? modules : allDataModuleKeys();
  const snapshot = await getFmpResearchSnapshot(normalized, {
    modules: effectiveModules,
    baseSnapshot: stored?.research.snapshot
  });
  const research = await buildEnrichedResearch(snapshot);
  const persisted = await persistResearchIfUseful(research);

  if (!persisted && stored) {
    return withPersistedSnapshotWarning(stored);
  }

  snapshotCache.set(normalized, {
    expiresAt: Date.now() + FIVE_MINUTES,
    value: research
  });
  await setJsonCache(`research:${normalized}`, research, RESEARCH_CACHE_SECONDS);
  return research;
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
  const universe = await getResearchUniverse({ limit: 8 });
  const research = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));
  const averageDailyChange = research.length
    ? research.reduce(
        (sum, item) => sum + (item.snapshot.quote.changesPercentage ?? 0),
        0
      ) / research.length
    : 0;
  const moduleStates = research.flatMap(
    (item) => item.snapshot.dataStatus.modules ?? []
  );
  const liveModuleCount = moduleStates.filter(
    (module) => module.status === "live"
  ).length;
  const upcomingEarningsCount = research.reduce(
    (count, item) => count + item.snapshot.upcomingEvents.length,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    marketPulse: [
      {
        label: "观察列表平均涨跌",
        value: formatPercent(averageDailyChange, 1),
        direction:
          averageDailyChange > 0.2
            ? "positive"
            : averageDailyChange < -0.2
              ? "negative"
              : "neutral",
        detail: `基于当前观察列表 ${research.length} 个标的的日内涨跌幅等权计算。`
      },
      {
        label: "数据模块覆盖",
        value: `${liveModuleCount}/${moduleStates.length}`,
        direction:
          moduleStates.length > 0 && liveModuleCount === moduleStates.length
            ? "positive"
            : "mixed",
        detail: "显示当前观察列表中实时有效模块数与已登记模块总数。"
      },
      {
        label: "未来财报事件",
        value: `${upcomingEarningsCount} 个`,
        direction: "neutral",
        detail: "统计当前观察列表未来 180 天内已载入的财报事件。"
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
