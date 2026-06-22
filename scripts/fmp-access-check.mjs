const apiKey = process.env.FMP_API_KEY;
const baseUrl = process.env.FMP_BASE_URL ?? "https://financialmodelingprep.com/stable";
const symbol = process.env.FMP_CHECK_SYMBOL ?? "AAPL";

const checks = [
  ["profile", "profile", { symbol }],
  ["quote", "quote", { symbol }],
  ["income statement", "income-statement", { symbol, period: "annual", limit: "1" }],
  ["balance sheet", "balance-sheet-statement", { symbol, period: "annual", limit: "1" }],
  ["cash flow", "cash-flow-statement", { symbol, period: "annual", limit: "1" }],
  ["key metrics", "key-metrics", { symbol, period: "annual", limit: "1" }],
  ["ratios", "ratios", { symbol, period: "annual", limit: "1" }],
  ["financial scores", "financial-scores", { symbol }],
  ["analyst estimates", "analyst-estimates", { symbol, period: "annual", limit: "1" }],
  ["price target consensus", "price-target-consensus", { symbol }],
  ["ratings snapshot", "ratings-snapshot", { symbol }],
  ["dcf", "discounted-cash-flow", { symbol }],
  ["levered dcf", "levered-discounted-cash-flow", { symbol }],
  ["enterprise values", "enterprise-values", { symbol, period: "annual", limit: "1" }],
  ["stock news", "news/stock", { symbols: symbol, limit: "1" }],
  ["press releases", "news/press-releases", { symbol, limit: "1" }],
  [
    "sec filings",
    "sec-filings-search/symbol",
    { symbol, from: "2025-01-01", to: "2026-12-31", page: "0", limit: "1" }
  ],
  ["insider trading", "insider-trading/search", { symbol, page: "0", limit: "1" }],
  ["senate trades", "senate-trades", { symbol }],
  ["house trades", "house-trades", { symbol }],
  ["earnings", "earnings", { symbol }],
  ["historical eod", "historical-price-eod/light", { symbol, from: "2026-01-01", to: "2026-12-31" }],
  ["stock peers", "stock-peers", { symbol }],
  ["13f institutional ownership", "institutional-ownership/latest", { symbol }],
  ["earnings transcripts", "earning-call-transcript", { symbol, year: "2025", quarter: "1" }]
];

function endpointUrl(path, params) {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("apikey", apiKey ?? "");
  return url;
}

if (!apiKey) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        skipped: true,
        reason: "FMP_API_KEY is not set. Set FMP_API_KEY to validate live Premium endpoint access.",
        checkedSymbol: symbol,
        plannedChecks: checks.map(([name, path]) => ({ name, path }))
      },
      null,
      2
    )
  );
  process.exit(0);
}

const results = [];

for (const [name, path, params] of checks) {
  const url = endpointUrl(path, params);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Keep raw text length only.
    }
    const itemCount = Array.isArray(json) ? json.length : json && typeof json === "object" ? 1 : 0;
    const responseLead = text.trim().slice(0, 500);
    const denied =
      response.status === 402 ||
      response.status === 401 ||
      response.status === 403 ||
      /^(rate limit|not available|upgrade|unauthorized|invalid api ?key|premium endpoint|restricted endpoint)/i.test(
        responseLead
      );

    results.push({
      name,
      path,
      ok: response.ok && !denied,
      status: response.status,
      itemCount,
      latencyMs: Date.now() - startedAt,
      note: denied ? text.slice(0, 160) : undefined
    });
  } catch (error) {
    results.push({
      name,
      path,
      ok: false,
      status: "error",
      latencyMs: Date.now() - startedAt,
      note: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

console.log(
  JSON.stringify(
    {
      ok: results.every((result) => result.ok),
      checkedSymbol: symbol,
      baseUrl,
      results
    },
    null,
    2
  )
);
