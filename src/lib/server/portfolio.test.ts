import { describe, expect, it, vi } from "vitest";
import { getPortfolioModel } from "@/lib/server/portfolio";

describe("portfolio model", () => {
  it("enriches memory fallback holdings with research signals and weights", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");

    const portfolio = await getPortfolioModel();
    const totalWeight = portfolio.holdings.reduce((sum, holding) => sum + holding.weight, 0);

    expect(portfolio.totalValue).toBeGreaterThan(0);
    expect(portfolio.totalCost).toBeGreaterThan(0);
    expect(portfolio.weightedQuality).toBeGreaterThanOrEqual(0);
    expect(portfolio.weightedQuality).toBeLessThanOrEqual(100);
    expect(portfolio.holdings.length).toBeGreaterThanOrEqual(2);
    expect(totalWeight).toBeCloseTo(100, 4);
    expect(portfolio.holdings.every((holding) => holding.topSignal.length > 0)).toBe(true);
    expect(portfolio.sectors.length).toBeGreaterThan(0);
  });
});
