import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function endpointFromInput(input: URL | RequestInfo) {
  const url = new URL(String(input));
  return {
    endpoint: url.pathname.replace(/^\/stable\//, ""),
    url
  };
}

describe("FMP adapter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FMP_API_KEY", "test-fmp-key");
    vi.stubEnv("FMP_USE_MOCKS", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("maps live symbol search results and records endpoint telemetry", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const { endpoint } = endpointFromInput(input);
      expect(endpoint).toBe("search-symbol");
      return jsonResponse([
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          exchange: "NASDAQ",
          sector: "Technology",
          industry: "Consumer Electronics",
          marketCap: 2980000000000
        }
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getFmpEndpointHealth, searchFmpSymbols } = await import("@/lib/server/fmp");
    const results = await searchFmpSymbols("Apple");
    const calledUrl = endpointFromInput(fetchMock.mock.calls[0][0]).url;
    const health = getFmpEndpointHealth();

    expect(results).toEqual([
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Consumer Electronics",
        marketCap: 2980000000000
      }
    ]);
    expect(calledUrl.searchParams.get("query")).toBe("APPLE");
    expect(calledUrl.searchParams.get("limit")).toBe("12");
    expect(calledUrl.searchParams.get("apikey")).toBe("test-fmp-key");
    expect(health).toHaveLength(1);
    expect(health[0]).toMatchObject({
      path: "search-symbol",
      ok: true,
      httpStatus: 200,
      itemCount: 1
    });
    expect(health[0].latencyMs).toBeGreaterThanOrEqual(0);
    expect(health[0].responseBytes).toBeGreaterThan(0);
  });

  it("falls back to bundled search results when live payload validation fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "not an array" })));

    const { getFmpEndpointHealth, searchFmpSymbols } = await import("@/lib/server/fmp");
    const results = await searchFmpSymbols("AAPL");
    const status = getFmpEndpointHealth().find((endpoint) => endpoint.path === "search-symbol");

    expect(results.some((item) => item.symbol === "AAPL")).toBe(true);
    expect(status).toMatchObject({
      path: "search-symbol",
      ok: false,
      httpStatus: 200
    });
    expect(status?.lastError).toContain("Expected array");
  });

  it("returns a mixed snapshot and endpoint errors when critical live payloads fail validation", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const { endpoint } = endpointFromInput(input);

      if (endpoint === "profile") {
        return jsonResponse({ error: "profile should be an array" });
      }
      if (endpoint === "quote") {
        return jsonResponse([
          {
            symbol: "AAPL",
            price: 201.5,
            change: 1.25,
            changesPercentage: 0.62,
            volume: 51000000,
            marketCap: 3050000000000
          }
        ]);
      }
      if (endpoint === "income-statement") {
        return jsonResponse([
          {
            date: "2025-09-30",
            calendarYear: "2025",
            revenue: 402100000000,
            netIncome: 101400000000
          }
        ]);
      }
      if (endpoint === "cash-flow-statement") {
        return jsonResponse([
          {
            date: "2025-09-30",
            freeCashFlow: 108200000000
          }
        ]);
      }

      return jsonResponse([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getFmpEndpointHealth, getFmpResearchSnapshot } = await import("@/lib/server/fmp");
    const snapshot = await getFmpResearchSnapshot("AAPL");
    const health = getFmpEndpointHealth();
    const profileStatus = health.find((endpoint) => endpoint.path === "profile");
    const quoteStatus = health.find((endpoint) => endpoint.path === "quote");

    expect(snapshot.profile.name).toBe("Apple Inc.");
    expect(snapshot.quote.price).toBe(201.5);
    expect(snapshot.dataStatus.mode).toBe("mixed");
    expect(snapshot.dataStatus.warnings.join(" ")).toContain("profile endpoint unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(22);
    expect(profileStatus).toMatchObject({
      path: "profile",
      ok: false,
      httpStatus: 200
    });
    expect(profileStatus?.lastError).toContain("Expected array");
    expect(quoteStatus).toMatchObject({
      path: "quote",
      ok: true,
      httpStatus: 200,
      itemCount: 1
    });
  });
});
