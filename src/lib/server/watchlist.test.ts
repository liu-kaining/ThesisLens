import { describe, expect, it, vi } from "vitest";
import { addWatchlistItem } from "@/lib/server/db";
import { getEnrichedWatchlist } from "@/lib/server/watchlist";

describe("watchlist enrichment", () => {
  it("adds daily what-changed badges for each monitored stock", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");
    await addWatchlistItem("AAPL");
    await addWatchlistItem("MSFT");
    await addWatchlistItem("NVDA");

    const watchlist = await getEnrichedWatchlist();
    const expectedCategories = [
      "price",
      "fundamentals",
      "estimates",
      "events",
      "filings",
      "behavior",
      "technical"
    ];

    expect(watchlist.items.length).toBeGreaterThanOrEqual(3);
    for (const item of watchlist.items) {
      expect(item.changeBadges.map((badge) => badge.category)).toEqual(expectedCategories);
      expect(item.changeBadges.every((badge) => badge.detail.length > 0)).toBe(true);
      expect(item.topSignal.length).toBeGreaterThan(0);
    }
  });
});
