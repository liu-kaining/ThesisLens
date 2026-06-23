import { getWatchlist } from "@/lib/server/db";

export type ResearchUniverse = {
  source: "watchlist";
  symbols: string[];
  count: number;
  isEmpty: boolean;
};

export async function getResearchUniverse(limit = 25): Promise<ResearchUniverse> {
  const watchlist = await getWatchlist();
  const seen = new Set<string>();
  const symbols = watchlist.items
    .map((item) => item.symbol.trim().toUpperCase())
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    })
    .slice(0, limit);

  return {
    source: "watchlist",
    symbols,
    count: symbols.length,
    isEmpty: symbols.length === 0
  };
}
