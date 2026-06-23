import { getCompanyResearch } from "@/lib/server/research";
import { getResearchUniverse, type ResearchUniverse } from "@/lib/server/universe";

type MarketCompany = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: number;
  pe?: number;
  quality: number;
  valuation: number;
  expectations: number;
};

export type MarketModel = {
  generatedAt: string;
  universe: ResearchUniverse;
  companies: MarketCompany[];
  sectors: Array<{
    sector: string;
    count: number;
    averageMove: number;
    averageQuality: number;
    averageValuation: number;
  }>;
};

function universeFromSymbols(symbols: string[]): ResearchUniverse {
  const seen = new Set<string>();
  const normalized = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    });

  return {
    source: "watchlist",
    symbols: normalized,
    count: normalized.length,
    isEmpty: normalized.length === 0
  };
}

export async function getMarketModel(symbols?: string[]): Promise<MarketModel> {
  const universe = symbols ? universeFromSymbols(symbols) : await getResearchUniverse();
  const models = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));
  const companies = models.map((model) => ({
    symbol: model.snapshot.profile.symbol,
    name: model.snapshot.profile.name,
    sector: model.snapshot.profile.sector,
    price: model.snapshot.quote.price,
    changePercent: model.snapshot.quote.changesPercentage,
    marketCap: model.snapshot.quote.marketCap,
    pe: model.snapshot.quote.pe,
    quality: model.scores.find((score) => score.scoreType === "quality")?.score ?? 0,
    valuation: model.scores.find((score) => score.scoreType === "valuation")?.score ?? 0,
    expectations: model.scores.find((score) => score.scoreType === "expectations")?.score ?? 0
  }));
  const sectors = new Map<string, { count: number; quality: number; valuation: number; move: number }>();

  for (const company of companies) {
    const existing = sectors.get(company.sector) ?? { count: 0, quality: 0, valuation: 0, move: 0 };
    sectors.set(company.sector, {
      count: existing.count + 1,
      quality: existing.quality + company.quality,
      valuation: existing.valuation + company.valuation,
      move: existing.move + company.changePercent
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    universe,
    companies,
    sectors: Array.from(sectors.entries()).map(([sector, values]) => ({
      sector,
      count: values.count,
      averageMove: values.move / values.count,
      averageQuality: Math.round(values.quality / values.count),
      averageValuation: Math.round(values.valuation / values.count)
    }))
  };
}
