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
        label: "Market mode",
        value: "Selective risk-on",
        direction: "mixed",
        detail: "Mega-cap quality remains bid, but valuation dispersion is wide."
      },
      {
        label: "Research focus",
        value: "Revision quality",
        direction: "positive",
        detail: "FMP estimates and price targets are prioritized over raw headlines."
      },
      {
        label: "Event load",
        value: "Moderate",
        direction: "neutral",
        detail: "Upcoming earnings windows drive the highest event-risk flags."
      }
    ],
    watchlist: research.map(({ snapshot, scores, signals }) => ({
      symbol: snapshot.profile.symbol,
      name: snapshot.profile.name,
      price: snapshot.quote.price,
      changePercent: snapshot.quote.changesPercentage,
      topSignal: signals[0]?.title ?? "No signal computed",
      score: Math.round(
        scores
          .filter((score) => ["quality", "valuation", "expectations"].includes(score.scoreType))
          .reduce((sum, score) => sum + score.score, 0) / 3
      )
    })),
    researchIdeas: [
      {
        symbol: "MSFT",
        title: "High quality with estimate momentum",
        thesis:
          "Strong margins and positive revisions make valuation discipline the core research question.",
        direction: "positive"
      },
      {
        symbol: "NVDA",
        title: "Exceptional growth, crowded expectations",
        thesis:
          "The thesis depends on whether forward demand keeps outrunning already elevated expectations.",
        direction: "mixed"
      },
      {
        symbol: "AAPL",
        title: "Cash-flow machine with catalyst question",
        thesis:
          "Quality is durable, but investors need evidence of accelerating services or hardware replacement demand.",
        direction: "mixed"
      }
    ]
  };
}
