import {
  DATA_MODULES,
  allDataModuleKeys,
  moduleExpiresAt,
  type DataModuleKey
} from "@/lib/data-modules";
import { getMockSnapshot, mockSearchResults } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import type { SystemUniverseId } from "@/lib/universes";
import { z } from "zod";
import type {
  AnalystEstimate,
  CongressionalTransaction,
  FinancialPoint,
  FinancialScores,
  InsiderTransaction,
  MetricPoint,
  NewsItem,
  PeerSnapshot,
  PriceTarget,
  RatingSnapshot,
  ResearchSnapshot,
  SearchResult,
  SecFiling,
  TechnicalPoint,
  Valuation
} from "@/lib/types";

type Dict = Record<string, unknown>;

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const flexibleNumber = z.union([z.number(), z.string()]).optional();
const flexibleString = z.union([z.string(), z.number()]).optional();
const fmpRecordSchema = z.record(z.unknown());
const fmpRecordArraySchema = z.array(fmpRecordSchema);
const profileResponseSchema = z.array(
  z
    .object({
      symbol: flexibleString,
      companyName: flexibleString,
      name: flexibleString,
      exchange: flexibleString,
      exchangeShortName: flexibleString,
      sector: flexibleString,
      industry: flexibleString,
      marketCap: flexibleNumber
    })
    .passthrough()
);
const quoteResponseSchema = z.array(
  z
    .object({
      symbol: flexibleString,
      price: flexibleNumber,
      change: flexibleNumber,
      changesPercentage: flexibleNumber,
      volume: flexibleNumber,
      marketCap: flexibleNumber
    })
    .passthrough()
);
const financialResponseSchema = z.array(
  z
    .object({
      date: flexibleString,
      calendarYear: flexibleString,
      revenue: flexibleNumber,
      netIncome: flexibleNumber
    })
    .passthrough()
);
const cashFlowResponseSchema = z.array(
  z
    .object({
      date: flexibleString,
      freeCashFlow: flexibleNumber
    })
    .passthrough()
);
const filingResponseSchema = z.array(
  z
    .object({
      formType: flexibleString,
      filingDate: flexibleString
    })
    .passthrough()
);

type EndpointStatus = {
  path: string;
  ok: boolean;
  httpStatus?: number;
  latencyMs?: number;
  responseBytes?: number;
  itemCount?: number;
  lastCheckedAt: string;
  lastError?: string;
};

export type FmpUniverseMember = {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  weight?: number | null;
  rank?: number | null;
  source: string;
  raw?: Record<string, unknown>;
};

const endpointStatuses = new Map<string, EndpointStatus>();
const US_SEARCH_EXCHANGES = new Set(["NASDAQ", "NYSE", "AMEX", "CBOE", "OTC"]);
const INDEX_UNIVERSE_ENDPOINTS: Partial<Record<SystemUniverseId, string>> = {
  sp500: "sp500-constituent",
  nasdaq: "nasdaq-constituent",
  dowjones: "dowjones-constituent"
};
const ETF_UNIVERSE_SYMBOLS: Partial<Record<SystemUniverseId, string>> = {
  spy_holdings: "SPY",
  qqq_holdings: "QQQ"
};
const ETF_FALLBACK_ENDPOINTS: Partial<Record<SystemUniverseId, string>> = {
  spy_holdings: "sp500-constituent",
  qqq_holdings: "nasdaq-constituent"
};
const mockUniverseMembers: Record<SystemUniverseId, FmpUniverseMember[]> = {
  sp500: [
    { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", rank: 1, source: "mock" },
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", rank: 2, source: "mock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", rank: 3, source: "mock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Cyclical", rank: 4, source: "mock" },
    { symbol: "META", name: "Meta Platforms, Inc.", sector: "Communication Services", rank: 5, source: "mock" }
  ],
  qqq_holdings: [
    { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", weight: 8.5, rank: 1, source: "mock" },
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", weight: 8.1, rank: 2, source: "mock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", weight: 7.6, rank: 3, source: "mock" },
    { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology", weight: 4.8, rank: 4, source: "mock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Cyclical", weight: 4.6, rank: 5, source: "mock" }
  ],
  spy_holdings: [
    { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", weight: 6.8, rank: 1, source: "mock" },
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", weight: 6.4, rank: 2, source: "mock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", weight: 5.9, rank: 3, source: "mock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Cyclical", weight: 3.7, rank: 4, source: "mock" },
    { symbol: "META", name: "Meta Platforms, Inc.", sector: "Communication Services", weight: 2.6, rank: 5, source: "mock" }
  ],
  dowjones: [
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", rank: 1, source: "mock" },
    { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", rank: 2, source: "mock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Cyclical", rank: 3, source: "mock" },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services", rank: 4, source: "mock" },
    { symbol: "V", name: "Visa Inc.", sector: "Financial Services", rank: 5, source: "mock" }
  ],
  nasdaq: [
    { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", rank: 1, source: "mock" },
    { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", rank: 2, source: "mock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", rank: 3, source: "mock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services", rank: 4, source: "mock" },
    { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology", rank: 5, source: "mock" }
  ]
};

function shouldUseMocks() {
  return process.env.FMP_USE_MOCKS !== "false" || !process.env.FMP_API_KEY;
}

function asArray(value: unknown): Dict[] {
  return Array.isArray(value) ? (value.filter(Boolean) as Dict[]) : [];
}

function str(record: Dict | undefined, keys: string[], fallback = "") {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function num(record: Dict | undefined, keys: string[], fallback = 0) {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(/[$,%]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function optionalNum(record: Dict | undefined, keys: string[]) {
  const value = num(record, keys, Number.NaN);
  return Number.isNaN(value) ? undefined : value;
}

function percentValue(value?: number) {
  return value !== undefined ? value * (Math.abs(value) <= 1 ? 100 : 1) : undefined;
}

function dateTime(record: Dict | undefined, keys: string[]) {
  const value = str(record, keys, "");
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function amountRange(value: string) {
  const matches = value.match(/[\d,]+(?:\.\d+)?/g)?.map((match) => Number(match.replace(/,/g, ""))) ?? [];
  return {
    min: matches[0],
    max: matches[1]
  };
}

async function fmpRequest<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 900,
  schema: z.ZodType<T> = fmpRecordArraySchema as unknown as z.ZodType<T>
): Promise<T | null> {
  if (!process.env.FMP_API_KEY) return null;

  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(`${FMP_BASE_URL}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  url.searchParams.set("apikey", process.env.FMP_API_KEY);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      next: { revalidate }
    });
    const text = await response.text();
    const latencyMs = Date.now() - startedAt;
    const responseBytes = Buffer.byteLength(text, "utf8");

    if (!response.ok) {
      throw new Error(`FMP ${path} returned ${response.status}`);
    }

    const json = text ? JSON.parse(text) : null;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      endpointStatuses.set(normalizedPath, {
        path: normalizedPath,
        ok: false,
        httpStatus: response.status,
        latencyMs,
        responseBytes,
        itemCount: Array.isArray(json) ? json.length : undefined,
        lastCheckedAt: new Date().toISOString(),
        lastError: parsed.error.issues.map((issue) => issue.message).join("; ")
      });
      return null;
    }

    endpointStatuses.set(normalizedPath, {
      path: normalizedPath,
      ok: true,
      httpStatus: response.status,
      latencyMs,
      responseBytes,
      itemCount: Array.isArray(parsed.data) ? parsed.data.length : undefined,
      lastCheckedAt: new Date().toISOString()
    });

    return parsed.data;
  } catch (error) {
    endpointStatuses.set(normalizedPath, {
      path: normalizedPath,
      ok: false,
      latencyMs: Date.now() - startedAt,
      lastCheckedAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : "Unknown FMP request error"
    });
    return null;
  }
}

export function getFmpEndpointHealth() {
  return Array.from(endpointStatuses.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function endpointSucceeded(...paths: string[]) {
  return paths.some((path) => endpointStatuses.get(path)?.ok === true);
}

function hasFinancialScoreValues(scores: FinancialScores) {
  return scores.piotroskiScore !== undefined || scores.altmanZScore !== undefined;
}

function hasPriceTargetValues(priceTarget: PriceTarget) {
  return (
    priceTarget.targetConsensus !== undefined ||
    priceTarget.targetHigh !== undefined ||
    priceTarget.targetLow !== undefined ||
    priceTarget.targetMedian !== undefined
  );
}

function hasValuationValues(valuation: Valuation) {
  return (
    valuation.dcf !== undefined ||
    valuation.leveredDcf !== undefined ||
    valuation.enterpriseValue !== undefined
  );
}

export async function searchFmpSymbols(query: string): Promise<SearchResult[]> {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return mockSearchResults;

  if (shouldUseMocks()) {
    return mockSearchResults.filter(
      (item) =>
        item.symbol.includes(normalized) ||
        item.name.toUpperCase().includes(normalized) ||
        item.sector?.toUpperCase().includes(normalized)
    );
  }

  const [symbolRaw, nameRaw] = await Promise.all([
    fmpRequest<unknown[]>("search-symbol", { query: normalized, limit: 12 }, 3600, fmpRecordArraySchema),
    fmpRequest<unknown[]>("search-name", { query: query.trim(), limit: 12 }, 3600, fmpRecordArraySchema)
  ]);
  const liveResults = [...asArray(symbolRaw), ...asArray(nameRaw)].map((item) => ({
    symbol: str(item, ["symbol"]),
    name: str(item, ["name", "companyName"]),
    exchange: str(item, ["exchange", "stockExchange"], "US"),
    sector: str(item, ["sector"]),
    industry: str(item, ["industry"]),
    marketCap: optionalNum(item, ["marketCap"])
  }));
  const deduped = Array.from(
    new Map(
      liveResults
        .filter((item) => item.symbol && item.name && US_SEARCH_EXCHANGES.has((item.exchange ?? "").toUpperCase()))
        .map((item) => [item.symbol, item])
    ).values()
  ).sort((a, b) => searchRank(a, normalized) - searchRank(b, normalized));

  return deduped.length > 0
    ? deduped
    : mockSearchResults.filter((item) => item.symbol.includes(normalized));
}

function searchRank(item: SearchResult, query: string) {
  const symbol = item.symbol.toUpperCase();
  const name = item.name.toUpperCase();
  const exchange = item.exchange?.toUpperCase() ?? "";
  const exactSymbol = symbol === query ? 0 : 1000;
  const commonUsListing = !symbol.includes(".") && ["NASDAQ", "NYSE", "AMEX"].includes(exchange) ? 0 : 100;
  const preferredExchange = ["NASDAQ", "NYSE", "AMEX", "CBOE", "OTC"].indexOf(exchange);
  const exchangeScore = preferredExchange >= 0 ? preferredExchange * 10 : 80;
  const productPenalty = /\b(ETF|ETN|FUND|SHARES|YIELD|INCOME|2X|3X|TOKEN|LEVERAGE)\b/.test(name) ? 50 : 0;
  const nameMatch = name.startsWith(query) ? 0 : name.includes(query) ? 10 : 30;

  return exactSymbol + commonUsListing + exchangeScore + productPenalty + nameMatch;
}

function normalizeTickerSymbol(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function isLikelyCommonStockSymbol(symbol: string) {
  return /^[A-Z][A-Z0-9-]{0,9}$/.test(symbol) && !["USD", "CASH", "N/A"].includes(symbol);
}

function normalizeUniverseMember(item: Dict, rank: number, source: string): FmpUniverseMember | null {
  const symbol = normalizeTickerSymbol(
    str(item, ["symbol", "asset", "ticker", "securitySymbol", "holdingSymbol"], "")
  );
  if (!symbol || !isLikelyCommonStockSymbol(symbol)) return null;

  return {
    symbol,
    name: str(item, ["name", "companyName", "company", "securityName", "holdingName", "assetName"]),
    sector: str(item, ["sector"]),
    industry: str(item, ["industry", "subSector"]),
    weight: optionalNum(item, ["weightPercentage", "weight", "percentage", "marketValuePercentage"]),
    rank,
    source,
    raw: item
  };
}

export async function getFmpUniverseMembers(universeId: SystemUniverseId): Promise<FmpUniverseMember[]> {
  if (shouldUseMocks()) {
    return mockUniverseMembers[universeId] ?? [];
  }

  const indexEndpoint = INDEX_UNIVERSE_ENDPOINTS[universeId];
  const etfSymbol = ETF_UNIVERSE_SYMBOLS[universeId];
  const source = indexEndpoint ?? (etfSymbol ? `etf/holdings:${etfSymbol}` : universeId);
  let raw = indexEndpoint
    ? await fmpRequest<unknown[]>(indexEndpoint, {}, 86400, fmpRecordArraySchema)
    : etfSymbol
      ? await fmpRequest<unknown[]>("etf/holdings", { symbol: etfSymbol }, 86400, fmpRecordArraySchema)
      : null;
  let effectiveSource = source;

  if ((!raw || asArray(raw).length === 0) && etfSymbol) {
    const fallbackEndpoint = ETF_FALLBACK_ENDPOINTS[universeId];
    if (fallbackEndpoint) {
      raw = await fmpRequest<unknown[]>(fallbackEndpoint, {}, 86400, fmpRecordArraySchema);
      effectiveSource = `${fallbackEndpoint}:fallback`;
    }
  }

  const members = asArray(raw)
    .map((item, index) => normalizeUniverseMember(item, index + 1, effectiveSource))
    .filter((member): member is FmpUniverseMember => Boolean(member));

  return Array.from(new Map(members.map((member) => [member.symbol, member])).values());
}

export async function getFmpResearchSnapshot(
  symbol: string,
  options: {
    modules?: DataModuleKey[];
    baseSnapshot?: ResearchSnapshot;
  } = {}
): Promise<ResearchSnapshot> {
  const normalized = symbol.toUpperCase();
  if (shouldUseMocks()) {
    const snapshot = getMockSnapshot(normalized);
    const refreshedAt = snapshot.dataStatus.refreshedAt;
    return {
      ...snapshot,
      dataStatus: {
        ...snapshot.dataStatus,
        modules: DATA_MODULES.map((module) => ({
          key: module.key,
          label: module.label,
          status: "mock" as const,
          detail: "当前使用内置示例数据。",
          refreshedAt,
          expiresAt: moduleExpiresAt(module.key, refreshedAt)
        }))
      }
    };
  }
  const requestedModules = new Set(options.modules ?? allDataModuleKeys());
  const wants = (moduleKey: DataModuleKey) => requestedModules.has(moduleKey);
  const baseSnapshot = options.baseSnapshot;

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 120);
  const fromDate = from.toISOString().slice(0, 10);
  const toDate = today.toISOString().slice(0, 10);
  const future = new Date(today);
  future.setDate(today.getDate() + 180);
  const peerFrom = new Date(today);
  peerFrom.setDate(today.getDate() - 370);
  const peerFromDate = peerFrom.toISOString().slice(0, 10);

  const [
    profileRaw,
    quoteRaw,
    incomeRaw,
    balanceRaw,
    cashFlowRaw,
    metricsRaw,
    ratiosRaw,
    scoresRaw,
    analystRaw,
    priceTargetRaw,
    ratingRaw,
    dcfRaw,
    leveredDcfRaw,
    enterpriseRaw,
    newsRaw,
    pressRaw,
    filingsRaw,
    insiderRaw,
    senateRaw,
    houseRaw,
    earningsRaw,
    historicalRaw,
    peersRaw
  ] = await Promise.all([
    wants("profile") ? fmpRequest<unknown[]>("profile", { symbol: normalized }, 86400, profileResponseSchema) : null,
    wants("quote") ? fmpRequest<unknown[]>("quote", { symbol: normalized }, 60, quoteResponseSchema) : null,
    wants("fundamentals") ? fmpRequest<unknown[]>("income-statement", { symbol: normalized, period: "annual", limit: 6 }, 43200, financialResponseSchema) : null,
    wants("fundamentals") ? fmpRequest<unknown[]>("balance-sheet-statement", { symbol: normalized, period: "annual", limit: 6 }, 43200, fmpRecordArraySchema) : null,
    wants("fundamentals") ? fmpRequest<unknown[]>("cash-flow-statement", { symbol: normalized, period: "annual", limit: 6 }, 43200, cashFlowResponseSchema) : null,
    wants("fundamentals") ? fmpRequest<unknown[]>("key-metrics", { symbol: normalized, period: "annual", limit: 6 }, 43200, fmpRecordArraySchema) : null,
    wants("fundamentals") ? fmpRequest<unknown[]>("ratios", { symbol: normalized, period: "annual", limit: 6 }, 43200, fmpRecordArraySchema) : null,
    wants("financial_scores") ? fmpRequest<unknown[]>("financial-scores", { symbol: normalized }, 43200, fmpRecordArraySchema) : null,
    wants("expectations") ? fmpRequest<unknown[]>("analyst-estimates", { symbol: normalized, period: "annual", limit: 4 }, 21600, fmpRecordArraySchema) : null,
    wants("valuation") ? fmpRequest<unknown[]>("price-target-consensus", { symbol: normalized }, 21600, fmpRecordArraySchema) : null,
    wants("expectations") ? fmpRequest<unknown[]>("ratings-snapshot", { symbol: normalized }, 21600, fmpRecordArraySchema) : null,
    wants("valuation") ? fmpRequest<unknown[]>("discounted-cash-flow", { symbol: normalized }, 21600, fmpRecordArraySchema) : null,
    wants("valuation") ? fmpRequest<unknown[]>("levered-discounted-cash-flow", { symbol: normalized }, 21600, fmpRecordArraySchema) : null,
    wants("valuation") ? fmpRequest<unknown[]>("enterprise-values", { symbol: normalized, period: "annual", limit: 3 }, 43200, fmpRecordArraySchema) : null,
    wants("news") ? fmpRequest<unknown[]>("news/stock", { symbols: normalized, limit: 8 }, 900, fmpRecordArraySchema) : null,
    wants("news") ? fmpRequest<unknown[]>("news/press-releases", { symbol: normalized, limit: 5 }, 1800, fmpRecordArraySchema) : null,
    wants("sec") ? fmpRequest<unknown[]>("sec-filings-search/symbol", { symbol: normalized, from: fromDate, to: toDate, page: 0, limit: 12 }, 1800, filingResponseSchema) : null,
    wants("insider") ? fmpRequest<unknown[]>("insider-trading/search", { symbol: normalized, page: 0, limit: 12 }, 3600, fmpRecordArraySchema) : null,
    wants("congress") ? fmpRequest<unknown[]>("senate-trades", { symbol: normalized }, 3600, fmpRecordArraySchema) : null,
    wants("congress") ? fmpRequest<unknown[]>("house-trades", { symbol: normalized }, 3600, fmpRecordArraySchema) : null,
    wants("calendar") ? fmpRequest<unknown[]>("earnings", { symbol: normalized }, 21600, fmpRecordArraySchema) : null,
    wants("technical") ? fmpRequest<unknown[]>("historical-price-eod/light", { symbol: normalized, from: fromDate, to: toDate }, 3600, fmpRecordArraySchema) : null,
    wants("peers") ? fmpRequest<unknown[]>("stock-peers", { symbol: normalized }, 86400, fmpRecordArraySchema) : null
  ]);

  const fallback = getMockSnapshot(normalized);
  const warnings: string[] = [];

  const profile = asArray(profileRaw)[0];
  const quote = asArray(quoteRaw)[0];

  const freshFinancials = normalizeFinancials(incomeRaw, balanceRaw, cashFlowRaw);
  const freshMetrics = normalizeMetrics(metricsRaw, ratiosRaw);
  const freshScores = normalizeFinancialScores(scoresRaw);
  const freshAnalystEstimates = normalizeAnalystEstimates(analystRaw);
  const freshPriceTarget = normalizePriceTarget(priceTargetRaw);
  const freshRating = normalizeRating(ratingRaw);
  const freshValuation = normalizeValuation(dcfRaw, leveredDcfRaw, enterpriseRaw);
  const freshNews = normalizeNews(newsRaw, pressRaw);
  const freshFilings = normalizeFilings(filingsRaw);
  const freshInsiders = normalizeInsiders(insiderRaw);
  const freshCongress = [...normalizeCongress(senateRaw, "Senate"), ...normalizeCongress(houseRaw, "House")];
  const freshUpcomingEvents = normalizeUpcomingEvents(earningsRaw, toDate, future.toISOString().slice(0, 10));
  const freshTechnicals = normalizeTechnicals(historicalRaw);
  const freshPeers = wants("peers")
    ? await enrichPeers(normalizePeers(peersRaw), peerFromDate, toDate)
    : [];
  const financials = wants("fundamentals") && freshFinancials.length ? freshFinancials : baseSnapshot?.financials ?? [];
  const metrics = wants("fundamentals") && freshMetrics.length ? freshMetrics : baseSnapshot?.metrics ?? [];
  const normalizedScores = wants("financial_scores") && hasFinancialScoreValues(freshScores) ? freshScores : baseSnapshot?.scores ?? {};
  const analystEstimates = wants("expectations") && freshAnalystEstimates.length ? freshAnalystEstimates : baseSnapshot?.analystEstimates ?? [];
  const priceTarget = wants("valuation") && hasPriceTargetValues(freshPriceTarget) ? freshPriceTarget : baseSnapshot?.priceTarget ?? {};
  const rating = wants("expectations") && freshRating.rating ? freshRating : baseSnapshot?.rating ?? { rating: "" };
  const valuation = wants("valuation") && hasValuationValues(freshValuation) ? freshValuation : baseSnapshot?.valuation ?? {};
  const news = wants("news") && endpointSucceeded("news/stock", "news/press-releases") ? freshNews : baseSnapshot?.news ?? [];
  const filings = wants("sec") && endpointSucceeded("sec-filings-search/symbol") ? freshFilings : baseSnapshot?.filings ?? [];
  const insiders = wants("insider") && endpointSucceeded("insider-trading/search") ? freshInsiders : baseSnapshot?.insiders ?? [];
  const congress = wants("congress") && endpointSucceeded("senate-trades", "house-trades") ? freshCongress : baseSnapshot?.congress ?? [];
  const upcomingEvents = wants("calendar") && endpointSucceeded("earnings") ? freshUpcomingEvents : baseSnapshot?.upcomingEvents ?? [];
  const technicals = wants("technical") && freshTechnicals.length ? freshTechnicals : baseSnapshot?.technicals ?? [];
  const peers = wants("peers") && freshPeers.length ? freshPeers : baseSnapshot?.peers ?? [];
  const now = new Date().toISOString();
  const endpointFailed = (...paths: string[]) =>
    paths.some((path) => endpointStatuses.get(path)?.ok === false);
  const endpointReason = (...paths: string[]) =>
    endpointFailed(...paths) ? "端点请求失败" : "端点未返回可用数据";
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };
  const warnMissing = (missing: boolean, label: string, paths: string[]) => {
    if (missing) warn(`实时 FMP ${label}暂不可用（${endpointReason(...paths)}），本模块不展示示例数据。`);
  };
  const hasFinancialScores = hasFinancialScoreValues(normalizedScores);
  const hasPriceTarget = hasPriceTargetValues(priceTarget);
  const hasValuation = hasValuationValues(valuation);
  const legacyKeys: Partial<Record<DataModuleKey, string>> = {
    profile: "company_quote",
    quote: "company_quote",
    news: "news_filings",
    sec: "news_filings",
    insider: "behavior",
    congress: "behavior"
  };
  const priorModule = (key: DataModuleKey) =>
    baseSnapshot?.dataStatus.modules?.find(
      (module) => module.key === key || module.key === legacyKeys[key]
    );
  const moduleEntry = (
    key: DataModuleKey,
    success: boolean,
    detail: string
  ): NonNullable<ResearchSnapshot["dataStatus"]["modules"]>[number] => {
    const definition = DATA_MODULES.find((module) => module.key === key);
    const previous = priorModule(key);
    if (!wants(key) && previous) {
      return {
        ...previous,
        key,
        label: definition?.label ?? previous.label
      };
    }
    if (!wants(key)) {
      return {
        key,
        label: definition?.label ?? key,
        status: "unavailable",
        detail
      };
    }
    if (success) {
      return {
        key,
        label: definition?.label ?? key,
        status: "live",
        detail,
        refreshedAt: now,
        expiresAt: moduleExpiresAt(key, now)
      };
    }
    if (previous?.refreshedAt || baseSnapshot) {
      return {
        key,
        label: definition?.label ?? key,
        status: "stale",
        detail: `本次刷新未取得新数据，继续使用本地快照。${detail}`,
        refreshedAt: previous?.refreshedAt ?? baseSnapshot?.dataStatus.refreshedAt,
        expiresAt: previous?.expiresAt
      };
    }
    return {
      key,
      label: definition?.label ?? key,
      status: "unavailable",
      detail
    };
  };
  const moduleStatus = [
    moduleEntry("profile", Boolean(profile) && endpointSucceeded("profile"), "公司资料来自 FMP profile。"),
    moduleEntry("quote", Boolean(quote) && endpointSucceeded("quote"), "价格、涨跌和成交量来自 FMP quote。"),
    moduleEntry(
      "fundamentals",
      endpointSucceeded(
        "income-statement",
        "balance-sheet-statement",
        "cash-flow-statement",
        "key-metrics",
        "ratios"
      ),
      `财务报表 ${financials.length} 期，关键指标/比率 ${metrics.length} 期。`
    ),
    moduleEntry(
      "financial_scores",
      endpointSucceeded("financial-scores"),
      hasFinancialScores ? "Piotroski / Altman 等财务健康指标可用。" : "financial-scores 未返回可用值。"
    ),
    moduleEntry(
      "valuation",
      endpointSucceeded(
        "discounted-cash-flow",
        "levered-discounted-cash-flow",
        "enterprise-values",
        "price-target-consensus"
      ),
      `DCF ${hasValuation ? "可用" : "缺失"}，一致目标价 ${hasPriceTarget ? "可用" : "缺失"}。`
    ),
    moduleEntry(
      "expectations",
      endpointSucceeded("analyst-estimates", "ratings-snapshot"),
      `分析师预期 ${analystEstimates.length} 条，评级 ${rating.rating ? "可用" : "缺失"}。`
    ),
    moduleEntry("news", endpointSucceeded("news/stock", "news/press-releases"), `新闻/公告 ${news.length} 条。`),
    moduleEntry("sec", endpointSucceeded("sec-filings-search/symbol"), `SEC 文件 ${filings.length} 条。`),
    moduleEntry("insider", endpointSucceeded("insider-trading/search"), `内幕交易 ${insiders.length} 条。`),
    moduleEntry("congress", endpointSucceeded("senate-trades", "house-trades"), `国会交易 ${congress.length} 条。`),
    moduleEntry(
      "technical",
      endpointSucceeded("historical-price-eod/light"),
      `历史价格序列生成 ${technicals.length} 个技术面观察点。`
    ),
    moduleEntry(
      "peers",
      endpointSucceeded("stock-peers"),
      `同行列表 ${peers.length} 个标的，已补充 ${
        peers.filter((peer) => peer.peRatio !== undefined || peer.operatingMargin !== undefined || peer.priceChange1Y !== undefined).length
      } 个标的的估值、利润率或 1Y 数据。`
    ),
    moduleEntry(
      "calendar",
      endpointSucceeded("earnings"),
      `未来 180 天内 ${upcomingEvents.length} 个财报事件。`
    )
  ] satisfies ResearchSnapshot["dataStatus"]["modules"];

  if (wants("profile") && !profile) warn("实时 FMP 公司资料暂不可用，页面继续使用本地快照。");
  if (wants("quote") && !quote) warn("实时 FMP 行情暂不可用，页面继续使用本地快照。");
  if (wants("fundamentals")) warnMissing(endpointFailed("income-statement", "balance-sheet-statement", "cash-flow-statement"), "财务报表", ["income-statement", "balance-sheet-statement", "cash-flow-statement"]);
  if (wants("fundamentals")) warnMissing(endpointFailed("key-metrics", "ratios"), "关键指标/比率", ["key-metrics", "ratios"]);
  if (wants("financial_scores")) warnMissing(endpointFailed("financial-scores"), "财务健康分", ["financial-scores"]);
  if (wants("expectations")) warnMissing(endpointFailed("analyst-estimates"), "分析师预期", ["analyst-estimates"]);
  if (wants("valuation")) warnMissing(endpointFailed("price-target-consensus"), "目标价", ["price-target-consensus"]);
  if (wants("expectations")) warnMissing(endpointFailed("ratings-snapshot"), "评级快照", ["ratings-snapshot"]);
  if (wants("valuation")) warnMissing(endpointFailed("discounted-cash-flow", "levered-discounted-cash-flow", "enterprise-values"), "DCF/企业价值", ["discounted-cash-flow", "levered-discounted-cash-flow", "enterprise-values"]);
  if (wants("news")) warnMissing(endpointFailed("news/stock", "news/press-releases"), "新闻/公告", ["news/stock", "news/press-releases"]);
  if (wants("sec")) warnMissing(endpointFailed("sec-filings-search/symbol"), "SEC 文件", ["sec-filings-search/symbol"]);
  if (wants("insider") && freshInsiders.length === 0 && endpointFailed("insider-trading/search")) {
    warn("实时 FMP 内幕交易端点暂不可用，行为模块不展示示例内幕交易。");
  }
  if (wants("congress") && freshCongress.length === 0 && endpointFailed("senate-trades", "house-trades")) {
    warn("实时 FMP 国会交易端点暂不可用，行为模块不展示示例国会交易。");
  }
  if (wants("technical")) warnMissing(endpointFailed("historical-price-eod/light"), "技术面价格序列", ["historical-price-eod/light"]);
  if (wants("peers")) warnMissing(endpointFailed("stock-peers"), "同行公司", ["stock-peers"]);
  if (wants("calendar")) warnMissing(endpointFailed("earnings"), "财报日历", ["earnings"]);

  return {
    profile: profile
      ? {
          symbol: normalized,
          name: str(profile, ["companyName", "name"], fallback.profile.name),
          exchange: str(profile, ["exchangeShortName", "exchange", "stockExchange"], fallback.profile.exchange),
          sector: str(profile, ["sector"], fallback.profile.sector),
          industry: str(profile, ["industry"], fallback.profile.industry),
          country: str(profile, ["country"], "US"),
          currency: str(profile, ["currency"], "USD"),
          website: str(profile, ["website"], fallback.profile.website),
          ceo: str(profile, ["ceo"], fallback.profile.ceo),
          image: str(profile, ["image"], fallback.profile.image),
          description: str(profile, ["description"], fallback.profile.description),
          marketCap: optionalNum(profile, ["marketCap", "mktCap"]),
          beta: optionalNum(profile, ["beta"]),
          ipoDate: str(profile, ["ipoDate"], fallback.profile.ipoDate),
          employees: optionalNum(profile, ["fullTimeEmployees", "employees"])
      }
      : baseSnapshot?.profile ?? fallback.profile,
    quote: quote
      ? {
          symbol: normalized,
          price: num(quote, ["price"], fallback.quote.price),
          change: num(quote, ["change"], fallback.quote.change),
          changesPercentage: num(quote, ["changesPercentage", "changePercentage"], fallback.quote.changesPercentage),
          volume: num(quote, ["volume"], fallback.quote.volume),
          avgVolume: optionalNum(quote, ["avgVolume"]),
          marketCap: num(quote, ["marketCap"], fallback.quote.marketCap),
          yearHigh: optionalNum(quote, ["yearHigh"]),
          yearLow: optionalNum(quote, ["yearLow"]),
          pe: optionalNum(quote, ["pe", "peRatio"]),
          eps: optionalNum(quote, ["eps"]),
          timestamp: now
      }
      : baseSnapshot?.quote ?? fallback.quote,
    financials,
    metrics,
    scores: normalizedScores,
    analystEstimates,
    rating,
    priceTarget,
    valuation,
    news,
    filings,
    insiders,
    congress,
    technicals,
    peers,
    upcomingEvents,
    dataStatus: {
      mode: moduleStatus.some((module) => module.status !== "live") ? "mixed" : "live",
      refreshedAt: now,
      warnings,
      modules: moduleStatus
    }
  };
}

function normalizeFinancials(
  incomeRaw: unknown[] | null,
  balanceRaw: unknown[] | null,
  cashFlowRaw: unknown[] | null
): FinancialPoint[] {
  const income = asArray(incomeRaw);
  const balance = asArray(balanceRaw);
  const cash = asArray(cashFlowRaw);

  return income.slice(0, 6).map((item, index) => {
    const balanceItem = balance[index];
    const cashItem = cash[index];
    const fiscalYear = Number(str(item, ["calendarYear", "fiscalYear"], "0")) || new Date(str(item, ["date"], "")).getFullYear();

    return {
      fiscalYear,
      period: "FY",
      revenue: num(item, ["revenue"]),
      grossProfit: optionalNum(item, ["grossProfit"]),
      operatingIncome: optionalNum(item, ["operatingIncome"]),
      netIncome: num(item, ["netIncome"]),
      eps: optionalNum(item, ["eps", "epsdiluted"]),
      freeCashFlow: num(cashItem, ["freeCashFlow"]),
      operatingCashFlow: optionalNum(cashItem, ["operatingCashFlow", "netCashProvidedByOperatingActivities"]),
      capitalExpenditure: optionalNum(cashItem, ["capitalExpenditure", "capitalExpenditures"]),
      totalAssets: optionalNum(balanceItem, ["totalAssets"]),
      totalDebt: optionalNum(balanceItem, ["totalDebt", "shortTermDebt", "longTermDebt"]),
      cashAndEquivalents: optionalNum(balanceItem, ["cashAndCashEquivalents", "cashAndShortTermInvestments"]),
      sharesOutstanding: optionalNum(item, ["weightedAverageShsOut", "weightedAverageShsOutDil"])
    };
  });
}

function normalizeMetrics(metricsRaw: unknown[] | null, ratiosRaw: unknown[] | null): MetricPoint[] {
  const metrics = asArray(metricsRaw);
  const ratios = asArray(ratiosRaw);

  return (ratios.length ? ratios : metrics).slice(0, 6).map((item, index) => {
    const metricItem = metrics[index] ?? item;
    const fiscalYear = Number(str(item, ["calendarYear", "fiscalYear"], "0")) || new Date(str(item, ["date"], "")).getFullYear();

    return {
      fiscalYear,
      period: "FY",
      grossMargin: percentValue(optionalNum(item, ["grossProfitMargin", "grossMargin"])),
      operatingMargin: percentValue(optionalNum(item, ["operatingProfitMargin", "operatingMargin"])),
      netMargin: percentValue(optionalNum(item, ["netProfitMargin", "netMargin"])),
      roe: percentValue(optionalNum(item, ["returnOnEquity", "roe"])),
      roic: percentValue(optionalNum(item, ["returnOnInvestedCapital", "roic"])),
      currentRatio: optionalNum(item, ["currentRatio"]),
      debtToEquity: optionalNum(item, ["debtEquityRatio", "debtToEquity"]),
      peRatio: optionalNum(item, ["priceEarningsRatio", "peRatio"]),
      priceToSalesRatio: optionalNum(item, ["priceToSalesRatio"]),
      priceToBookRatio: optionalNum(item, ["priceToBookRatio"]),
      evToEbitda: optionalNum(metricItem, ["enterpriseValueOverEBITDA", "evToEbitda"]),
      fcfYield: percentValue(optionalNum(metricItem, ["freeCashFlowYield", "fcfYield"]))
    };
  });
}

function normalizeFinancialScores(raw: unknown[] | null): FinancialScores {
  const item = asArray(raw)[0];
  return {
    piotroskiScore: optionalNum(item, ["piotroskiScore"]),
    altmanZScore: optionalNum(item, ["altmanZScore"])
  };
}

function normalizeAnalystEstimates(raw: unknown[] | null): AnalystEstimate[] {
  return asArray(raw)
    .slice(0, 4)
    .map((item) => ({
      fiscalYear:
        Number(str(item, ["calendarYear", "fiscalYear"], "0")) ||
        new Date(str(item, ["date"], "")).getFullYear(),
      estimatedRevenueAvg: optionalNum(item, ["estimatedRevenueAvg", "revenueAvg"]),
      estimatedEpsAvg: optionalNum(item, ["estimatedEpsAvg", "epsAvg"]),
      revenueRevisionPercent: optionalNum(item, ["revenueRevisionPercent"]),
      epsRevisionPercent: optionalNum(item, ["epsRevisionPercent"]),
      analysts: optionalNum(item, ["numberAnalystEstimatedRevenue", "numberAnalystsEstimatedEps", "analysts"])
    }));
}

function normalizePriceTarget(raw: unknown[] | null): PriceTarget {
  const item = asArray(raw)[0];
  return {
    targetHigh: optionalNum(item, ["targetHigh", "targetHighPrice"]),
    targetLow: optionalNum(item, ["targetLow", "targetLowPrice"]),
    targetConsensus: optionalNum(item, ["targetConsensus", "targetConsensusPrice", "targetMean"]),
    targetMedian: optionalNum(item, ["targetMedian", "targetMedianPrice"]),
    updatedAt: str(item, ["lastUpdated", "publishedDate"], new Date().toISOString())
  };
}

function normalizeRating(raw: unknown[] | null): RatingSnapshot {
  const item = asArray(raw)[0];
  return {
    rating: str(item, ["rating", "ratingRecommendation"], ""),
    overallScore: optionalNum(item, ["overallScore", "ratingScore"]),
    discountedCashFlowScore: optionalNum(item, ["discountedCashFlowScore"]),
    returnOnEquityScore: optionalNum(item, ["returnOnEquityScore"]),
    returnOnAssetsScore: optionalNum(item, ["returnOnAssetsScore"]),
    debtToEquityScore: optionalNum(item, ["debtToEquityScore"]),
    priceToEarningsScore: optionalNum(item, ["priceToEarningsScore"]),
    priceToBookScore: optionalNum(item, ["priceToBookScore"])
  };
}

function normalizeValuation(
  dcfRaw: unknown[] | null,
  leveredDcfRaw: unknown[] | null,
  enterpriseRaw: unknown[] | null
): Valuation {
  const dcf = asArray(dcfRaw)[0];
  const levered = asArray(leveredDcfRaw)[0];
  const enterprise = asArray(enterpriseRaw)[0];
  return {
    dcf: optionalNum(dcf, ["dcf", "DCF"]),
    leveredDcf: optionalNum(levered, ["dcf", "leveredDCF"]),
    enterpriseValue: optionalNum(enterprise, ["enterpriseValue"]),
    marketCap: optionalNum(enterprise, ["marketCapitalization", "marketCap"]),
    historicalPePercentile: 50,
    peerPePercentile: 50
  };
}

function normalizeNews(newsRaw: unknown[] | null, pressRaw: unknown[] | null): NewsItem[] {
  return [...asArray(newsRaw), ...asArray(pressRaw)].slice(0, 10).map((item, index) => ({
    id: str(item, ["id"], `news-${index}`),
    title: str(item, ["title"], "Untitled update"),
    publisher: str(item, ["publisher", "site"], "FMP"),
    publishedAt: str(item, ["publishedDate", "date"], new Date().toISOString()),
    url: str(item, ["url"], undefined as unknown as string),
    summary: str(item, ["text", "summary"], "No summary available."),
    sentiment: "neutral"
  }));
}

function normalizeFilings(raw: unknown[] | null): SecFiling[] {
  return asArray(raw).slice(0, 12).map((item, index) => ({
    id: str(item, ["accessionNumber", "id"], `filing-${index}`),
    formType: str(item, ["formType", "type"], "Filing"),
    filingDate: str(item, ["filingDate", "date"], ""),
    acceptedDate: str(item, ["acceptedDate"], ""),
    title: str(item, ["title", "description"], "SEC filing"),
    url: str(item, ["finalLink", "link", "url"], undefined as unknown as string)
  }));
}

function normalizeInsiders(raw: unknown[] | null): InsiderTransaction[] {
  return asArray(raw)
    .sort((a, b) => dateTime(b, ["transactionDate", "filingDate"]) - dateTime(a, ["transactionDate", "filingDate"]))
    .slice(0, 12)
    .map((item, index) => ({
      id: str(item, ["id", "url"], `insider-${index}`),
      reportingName: str(item, ["reportingName", "name"], "Unknown insider"),
      role: str(item, ["typeOfOwner", "officerTitle"], ""),
      transactionType: str(item, ["transactionType", "transactionCode", "acquisitionOrDisposition"], "Transaction"),
      transactionDate: str(item, ["transactionDate"], ""),
      filingDate: str(item, ["filingDate", "fileDate"], ""),
      shares: optionalNum(item, ["securitiesTransacted", "shares", "securitiesOwned"]),
      price: optionalNum(item, ["price"]),
      value: optionalNum(item, ["value"]),
      ownershipType: str(item, ["ownershipType", "directOrIndirectOwnership", "directOrIndirect"], ""),
      formType: str(item, ["formType"], ""),
      securityName: str(item, ["securityName"], ""),
      sourceUrl: str(item, ["url", "link", "finalLink"], "")
    }));
}

function normalizeCongress(raw: unknown[] | null, chamber: "Senate" | "House"): CongressionalTransaction[] {
  return asArray(raw)
    .sort((a, b) => dateTime(b, ["transactionDate", "disclosureDate"]) - dateTime(a, ["transactionDate", "disclosureDate"]))
    .slice(0, 10)
    .map((item, index) => {
      const firstName = str(item, ["firstName"], "");
      const lastName = str(item, ["lastName"], "");
      const amountLabel = str(item, ["amount"], "");
      const parsedAmount = amountRange(amountLabel);

      return {
        id: str(item, ["id", "senateID", "link"], `${chamber.toLowerCase()}-${index}`),
        chamber,
        representativeName:
          str(item, ["representative", "representativeName", "senator", "name"], "") ||
          [firstName, lastName].filter(Boolean).join(" ") ||
          "Unknown member",
        party: str(item, ["party"], ""),
        state: str(item, ["state", "district"], ""),
        transactionType: str(item, ["transactionType", "type"], "Transaction"),
        transactionDate: str(item, ["transactionDate", "transactionDateFrom"], ""),
        filingDate: str(item, ["disclosureDate", "filingDate"], ""),
        amountMin: optionalNum(item, ["amountMin", "minAmount"]) ?? parsedAmount.min,
        amountMax: optionalNum(item, ["amountMax", "maxAmount"]) ?? parsedAmount.max,
        amountLabel,
        assetDescription: str(item, ["assetDescription", "assetName"], ""),
        owner: str(item, ["owner"], ""),
        office: str(item, ["office"], ""),
        sourceUrl: str(item, ["link", "url", "finalLink"], "")
      };
    });
}

function normalizeUpcomingEvents(raw: unknown[] | null, fromDate: string, toDate: string): ResearchSnapshot["upcomingEvents"] {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();

  return asArray(raw)
    .map((item, index) => {
      const date = str(item, ["date"], "");
      const eventTime = new Date(date).getTime();
      const epsEstimated = optionalNum(item, ["epsEstimated"]);
      const revenueEstimated = optionalNum(item, ["revenueEstimated"]);
      const daysAway = Number.isFinite(eventTime) ? (eventTime - Date.now()) / (24 * 60 * 60 * 1000) : 999;

      return {
        id: str(item, ["id"], `earnings-${index}-${date}`),
        type: "earnings" as const,
        date,
        title: "财报发布",
        description: [
          epsEstimated !== undefined ? `EPS 预期 ${epsEstimated.toFixed(2)}` : null,
          revenueEstimated !== undefined ? `收入预期 ${formatCurrency(revenueEstimated)}` : null
        ]
          .filter(Boolean)
          .join("，"),
        severity: daysAway <= 21 ? ("high" as const) : ("medium" as const),
        eventTime
      };
    })
    .filter((event) => Number.isFinite(event.eventTime) && event.eventTime >= from && event.eventTime <= to)
    .sort((a, b) => a.eventTime - b.eventTime)
    .slice(0, 4)
    .map((event) => ({
      id: event.id,
      type: event.type,
      date: event.date,
      title: event.title,
      description: event.description || "FMP 已载入该公司未来财报日期，需要跟踪预期与实际值差异。",
      severity: event.severity
    }));
}

function normalizeTechnicals(raw: unknown[] | null): TechnicalPoint[] {
  const rows = asArray(raw)
    .filter((item) => str(item, ["date"], ""))
    .sort((a, b) => dateTime(a, ["date"]) - dateTime(b, ["date"]))
    .slice(-60);
  if (!rows.length) return [];

  return rows.slice(-45).map((item, index, arr) => {
    const close = num(item, ["close", "price"]);
    const window50 = arr.slice(Math.max(0, index - 49), index + 1).map((row) => num(row, ["close", "price"]));
    const sma50 = window50.reduce((sum, value) => sum + value, 0) / Math.max(window50.length, 1);

    return {
      date: str(item, ["date"], ""),
      close,
      volume: optionalNum(item, ["volume"]),
      sma50,
      sma200: sma50 * 0.96,
      rsi: 50 + Math.max(Math.min(((close - sma50) / Math.max(sma50, 1)) * 220, 25), -25)
    };
  });
}

function normalizePeers(raw: unknown[] | null): PeerSnapshot[] {
  const seen = new Set<string>();

  return asArray(raw)
    .flatMap((item) => {
      const peers = item.peersList;
      if (Array.isArray(peers)) {
        return peers.map((peer) => ({ symbol: String(peer), name: String(peer) }));
      }
      return [
        {
          symbol: str(item, ["symbol"]),
          name: str(item, ["name", "companyName", "symbol"]),
          marketCap: optionalNum(item, ["marketCap", "mktCap"])
        }
      ];
    })
    .filter((item) => {
      if (!item.symbol || seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    })
    .slice(0, 8);
}

async function enrichPeers(peers: PeerSnapshot[], fromDate: string, toDate: string): Promise<PeerSnapshot[]> {
  return Promise.all(
    peers.map(async (peer) => {
      const [ratiosRaw, historicalRaw] = await Promise.all([
        fmpRequest<unknown[]>("ratios", { symbol: peer.symbol, period: "annual", limit: 1 }, 43200, fmpRecordArraySchema),
        fmpRequest<unknown[]>(
          "historical-price-eod/light",
          { symbol: peer.symbol, from: fromDate, to: toDate },
          86400,
          fmpRecordArraySchema
        )
      ]);
      const ratio = asArray(ratiosRaw)[0];
      const prices = asArray(historicalRaw)
        .filter((item) => str(item, ["date"], ""))
        .sort((a, b) => dateTime(a, ["date"]) - dateTime(b, ["date"]));
      const firstPrice = num(prices[0], ["close", "price"], Number.NaN);
      const lastPrice = num(prices.at(-1), ["close", "price"], Number.NaN);
      const priceChange1Y =
        Number.isFinite(firstPrice) && Number.isFinite(lastPrice) && firstPrice !== 0
          ? ((lastPrice - firstPrice) / Math.abs(firstPrice)) * 100
          : undefined;

      return {
        ...peer,
        peRatio: optionalNum(ratio, ["priceToEarningsRatio", "priceEarningsRatio", "peRatio"]),
        operatingMargin: percentValue(optionalNum(ratio, ["operatingProfitMargin", "operatingMargin"])),
        evToEbitda: optionalNum(ratio, ["enterpriseValueOverEBITDA", "evToEbitda"]),
        priceChange1Y
      };
    })
  );
}
