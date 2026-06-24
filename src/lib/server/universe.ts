import {
  getSystemUniverseMembers,
  getSystemUniverses,
  getWatchlist
} from "@/lib/server/db";
import {
  getSystemUniverseDefinition,
  normalizeResearchUniverseId,
  type ResearchUniverseId
} from "@/lib/universes";

export type ResearchUniverse = {
  id: ResearchUniverseId | "custom";
  source: "watchlist" | "system" | "custom";
  name: string;
  symbols: string[];
  count: number;
  totalCount: number;
  isEmpty: boolean;
  isTruncated: boolean;
};

type ResearchUniverseOptions = {
  id?: string | null;
  limit?: number;
};

export const SYSTEM_UNIVERSE_ANALYSIS_LIMIT = 20;

function normalizeSymbols(symbols: string[], limit?: number) {
  const seen = new Set<string>();
  const normalized = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    });

  return {
    symbols: limit ? normalized.slice(0, limit) : normalized,
    totalCount: normalized.length
  };
}

export async function getResearchUniverse(
  options: ResearchUniverseOptions = {}
): Promise<ResearchUniverse> {
  const id = normalizeResearchUniverseId(options.id);
  const limit = Math.max(1, options.limit ?? SYSTEM_UNIVERSE_ANALYSIS_LIMIT);

  if (id !== "watchlist") {
    const definition = getSystemUniverseDefinition(id);
    const [members, universes] = await Promise.all([
      getSystemUniverseMembers(id, limit),
      getSystemUniverses()
    ]);
    const record = universes.find((universe) => universe.id === id);
    const symbols = members.map((member) => member.symbol);
    const totalCount = record?.activeCount ?? symbols.length;

    return {
      id,
      source: "system",
      name: definition?.name ?? record?.name ?? id,
      symbols,
      count: symbols.length,
      totalCount,
      isEmpty: totalCount === 0,
      isTruncated: totalCount > symbols.length
    };
  }

  const watchlist = await getWatchlist();
  const normalized = normalizeSymbols(
    watchlist.items.map((item) => item.symbol),
    limit
  );

  return {
    id: "watchlist",
    source: "watchlist",
    name: "我的观察列表",
    symbols: normalized.symbols,
    count: normalized.symbols.length,
    totalCount: normalized.totalCount,
    isEmpty: normalized.totalCount === 0,
    isTruncated: normalized.totalCount > normalized.symbols.length
  };
}

export function researchUniverseFromSymbols(symbols: string[]): ResearchUniverse {
  const normalized = normalizeSymbols(symbols);

  return {
    id: "custom",
    source: "custom",
    name: "指定标的",
    symbols: normalized.symbols,
    count: normalized.symbols.length,
    totalCount: normalized.totalCount,
    isEmpty: normalized.totalCount === 0,
    isTruncated: false
  };
}
