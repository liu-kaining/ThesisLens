import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSystemUniversePage,
  isPlausibleSystemUniverseUpdate,
  syncSystemUniverse
} from "@/lib/server/system-universes";
import { getResearchUniverse } from "@/lib/server/universe";
import { normalizeResearchUniverseId } from "@/lib/universes";

describe("research universe", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the personal watchlist for an unknown selection", () => {
    expect(normalizeResearchUniverseId("unknown")).toBe("watchlist");
  });

  it("rejects destructive live universe shrinkage", () => {
    vi.stubEnv("FMP_USE_MOCKS", "false");

    expect(isPlausibleSystemUniverseUpdate("qqq_holdings", 1, 101)).toBe(false);
    expect(isPlausibleSystemUniverseUpdate("spy_holdings", 1, 503)).toBe(false);
    expect(isPlausibleSystemUniverseUpdate("sp500", 500, 503)).toBe(true);
  });

  it("loads a bounded system universe while preserving its total size", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");

    await syncSystemUniverse("sp500");
    const universe = await getResearchUniverse({ id: "sp500", limit: 2 });

    expect(universe.id).toBe("sp500");
    expect(universe.source).toBe("system");
    expect(universe.count).toBe(2);
    expect(universe.totalCount).toBeGreaterThanOrEqual(universe.count);
    expect(universe.isTruncated).toBe(universe.totalCount > universe.count);
  });

  it("paginates persisted universe members without losing the total count", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");

    await syncSystemUniverse("sp500");
    const model = await getSystemUniversePage("sp500", 2, 2);

    expect(model.pagination).toMatchObject({
      page: 2,
      pageSize: 2,
      pageCount: 3,
      totalCount: 5,
      from: 3,
      to: 4
    });
    expect(model.members.map((member) => member.symbol)).toEqual(["NVDA", "AMZN"]);
  });
});
