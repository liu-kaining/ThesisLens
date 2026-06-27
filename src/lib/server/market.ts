import { getCompanyResearch } from "@/lib/server/research";
import {
  getResearchUniverse,
  researchUniverseFromSymbols,
  type ResearchUniverse
} from "@/lib/server/universe";

type MarketCompany = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: number;
  pe?: number;
  quality: number | null;
  valuation: number | null;
  expectations: number | null;
};

export type MarketModel = {
  generatedAt: string;
  universe: ResearchUniverse;
  companies: MarketCompany[];
  sectors: Array<{
    sector: string;
    count: number;
    averageMove: number;
    averageQuality: number | null;
    averageValuation: number | null;
  }>;
};

export async function getMarketModel(
  symbols?: string[],
  universeId?: string | null
): Promise<MarketModel> {
  const universe = symbols
    ? researchUniverseFromSymbols(symbols)
    : await getResearchUniverse({ id: universeId });
  const models = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));
  const companies = models.map((model) => ({
    symbol: model.snapshot.profile.symbol,
    name: model.snapshot.profile.name,
    sector: model.snapshot.profile.sector,
    price: model.snapshot.quote.price,
    changePercent: model.snapshot.quote.changesPercentage,
    marketCap: model.snapshot.quote.marketCap,
    pe: model.snapshot.quote.pe,
    quality: model.scores.find((score) => score.scoreType === "quality")?.score ?? null,
    valuation: model.scores.find((score) => score.scoreType === "valuation")?.score ?? null,
    expectations: model.scores.find((score) => score.scoreType === "expectations")?.score ?? null
  }));
  const sectors = new Map<
    string,
    {
      count: number;
      quality: number;
      qualityCount: number;
      valuation: number;
      valuationCount: number;
      move: number;
    }
  >();

  for (const company of companies) {
    const existing = sectors.get(company.sector) ?? {
      count: 0,
      quality: 0,
      qualityCount: 0,
      valuation: 0,
      valuationCount: 0,
      move: 0
    };
    sectors.set(company.sector, {
      count: existing.count + 1,
      quality: existing.quality + (company.quality ?? 0),
      qualityCount: existing.qualityCount + (company.quality === null ? 0 : 1),
      valuation: existing.valuation + (company.valuation ?? 0),
      valuationCount:
        existing.valuationCount + (company.valuation === null ? 0 : 1),
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
      averageQuality: values.qualityCount
        ? Math.round(values.quality / values.qualityCount)
        : null,
      averageValuation: values.valuationCount
        ? Math.round(values.valuation / values.valuationCount)
        : null
    }))
  };
}
