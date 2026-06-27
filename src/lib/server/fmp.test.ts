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
      if (endpoint === "search-symbol") {
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
      }

      return jsonResponse([
        {
          symbol: "AAPL.NE",
          name: "Apple Inc.",
          exchange: "NEO"
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
    expect(health).toHaveLength(2);
    expect(health.find((endpoint) => endpoint.path === "search-symbol")).toMatchObject({
      path: "search-symbol",
      ok: true,
      httpStatus: 200,
      itemCount: 1
    });
    expect(health.find((endpoint) => endpoint.path === "search-name")).toMatchObject({
      path: "search-name",
      ok: true,
      httpStatus: 200,
      itemCount: 1
    });
    expect(health[0].latencyMs).toBeGreaterThanOrEqual(0);
    expect(health[0].responseBytes).toBeGreaterThan(0);
  });

  it("does not inject bundled search results when live payload validation fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "not an array" })));

    const { getFmpEndpointHealth, searchFmpSymbols } = await import("@/lib/server/fmp");
    const results = await searchFmpSymbols("AAPL");
    const status = getFmpEndpointHealth().find((endpoint) => endpoint.path === "search-symbol");
    const nameStatus = getFmpEndpointHealth().find((endpoint) => endpoint.path === "search-name");

    expect(results).toEqual([]);
    expect(status).toMatchObject({
      path: "search-symbol",
      ok: false,
      httpStatus: 200
    });
    expect(status?.lastError).toContain("Expected array");
    expect(nameStatus).toMatchObject({
      path: "search-name",
      ok: false,
      httpStatus: 200
    });
  });

  it("falls back to index constituents when an ETF holdings response only contains the ETF", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const { endpoint } = endpointFromInput(input);
      if (endpoint === "etf/holdings") {
        return jsonResponse([{ symbol: "QQQ", name: "Invesco QQQ Trust" }]);
      }
      if (endpoint === "nasdaq-constituent") {
        return jsonResponse([
          { symbol: "AAPL", name: "Apple Inc." },
          { symbol: "MSFT", name: "Microsoft Corporation" }
        ]);
      }
      return jsonResponse([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getFmpUniverseMembers } = await import("@/lib/server/fmp");
    const members = await getFmpUniverseMembers("qqq_holdings");

    expect(members.map((member) => member.symbol)).toEqual(["AAPL", "MSFT"]);
    expect(members.every((member) => member.source === "nasdaq-constituent:fallback")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("computes SMA and RSI from actual price history", async () => {
    const prices = Array.from({ length: 210 }, (_, index) => ({
      date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10),
      price: index + 1,
      volume: 1000 + index
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        const { endpoint } = endpointFromInput(input);
        return endpoint === "historical-price-eod/light"
          ? jsonResponse(prices)
          : jsonResponse([]);
      })
    );

    const { getFmpResearchSnapshot } = await import("@/lib/server/fmp");
    const snapshot = await getFmpResearchSnapshot("AAPL", {
      modules: ["technical"]
    });
    const latest = snapshot.technicals.at(-1);

    expect(snapshot.technicals).toHaveLength(90);
    expect(latest).toMatchObject({
      close: 210,
      sma50: 185.5,
      sma200: 110.5,
      rsi: 100
    });
  });

  it("does not mark empty analytical payloads as live data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([])));

    const { getFmpResearchSnapshot } = await import("@/lib/server/fmp");
    const snapshot = await getFmpResearchSnapshot("QQQ", {
      modules: [
        "fundamentals",
        "financial_scores",
        "valuation",
        "expectations",
        "technical"
      ]
    });
    const states = new Map(
      snapshot.dataStatus.modules?.map((module) => [module.key, module.status])
    );

    expect(states.get("fundamentals")).toBe("unavailable");
    expect(states.get("financial_scores")).toBe("unavailable");
    expect(states.get("valuation")).toBe("unavailable");
    expect(states.get("expectations")).toBe("unavailable");
    expect(states.get("technical")).toBe("unavailable");
    expect(
      snapshot.dataStatus.modules
        ?.filter((module) =>
          [
            "fundamentals",
            "financial_scores",
            "valuation",
            "expectations",
            "technical"
          ].includes(module.key)
        )
        .every((module) => module.attemptStatus === "success")
    ).toBe(true);
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

    expect(snapshot.profile.name).toBe("AAPL");
    expect(snapshot.quote.price).toBe(201.5);
    expect(snapshot.dataStatus.mode).toBe("mixed");
    expect(snapshot.dataStatus.warnings.join(" ")).toContain("公司资料暂不可用");
    expect(snapshot.dataStatus.modules?.some((module) => module.status === "unavailable")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(23);
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

  it("keeps endpoint status isolated between concurrent company refreshes", async () => {
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const { endpoint, url } = endpointFromInput(input);
      const symbol = url.searchParams.get("symbol");

      if (endpoint === "quote" && symbol === "AAAA") {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return jsonResponse([
          {
            symbol,
            price: 100,
            change: 1,
            changesPercentage: 1,
            volume: 1000,
            marketCap: 1000000
          }
        ]);
      }
      if (endpoint === "profile" && symbol === "AAAA") {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return jsonResponse([{ symbol, companyName: "Company A" }]);
      }
      if (endpoint === "profile" && symbol === "BBBB") {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return jsonResponse([{ symbol, companyName: "Company B" }]);
      }
      if (endpoint === "quote" && symbol === "BBBB") {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return jsonResponse({ error: "invalid quote payload" });
      }

      return jsonResponse([]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getFmpResearchSnapshot } = await import("@/lib/server/fmp");
    const [companyA, companyB] = await Promise.all([
      getFmpResearchSnapshot("AAAA", { modules: ["profile", "quote"] }),
      getFmpResearchSnapshot("BBBB", { modules: ["profile", "quote"] })
    ]);
    const moduleState = (
      snapshot: Awaited<ReturnType<typeof getFmpResearchSnapshot>>,
      key: string
    ) => snapshot.dataStatus.modules?.find((item) => item.key === key);

    expect(moduleState(companyA, "quote")?.status).toBe("live");
    expect(moduleState(companyB, "quote")?.status).toBe("unavailable");
  });
});
