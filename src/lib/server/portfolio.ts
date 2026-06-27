import { getPortfolioHoldings } from "@/lib/server/db";
import { getCompanyResearch } from "@/lib/server/research";

export type PortfolioModel = Awaited<ReturnType<typeof getPortfolioModel>>;

export async function getPortfolioModel() {
  const holdings = await getPortfolioHoldings();
  const rows = await Promise.all(
    holdings.map(async (holding) => {
      const research = await getCompanyResearch(holding.symbol);
      const price = research.snapshot.quote.price;
      const marketValue = holding.shares * price;
      const costBasis = holding.averageCost ? holding.averageCost * holding.shares : null;
      const unrealizedGain = costBasis === null ? null : marketValue - costBasis;
      const quality =
        research.scores.find((score) => score.scoreType === "quality")?.score ??
        null;
      const valuation =
        research.scores.find((score) => score.scoreType === "valuation")?.score ??
        null;
      const eventScore = research.scores.find(
        (score) => score.scoreType === "events"
      )?.score;
      const eventRisk = eventScore === undefined ? null : 100 - eventScore;

      return {
        ...holding,
        name: research.snapshot.profile.name,
        sector: research.snapshot.profile.sector,
        price,
        marketValue,
        costBasis,
        unrealizedGain,
        unrealizedGainPercent:
          costBasis && costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : null,
        quality,
        valuation,
        eventRisk,
        topSignal: research.signals[0]?.title ?? "暂无计算信号"
      };
    })
  );
  const totalValue = rows.reduce((sum, row) => sum + row.marketValue, 0);
  const totalCost = rows.reduce((sum, row) => sum + (row.costBasis ?? 0), 0);
  const sectors = new Map<string, number>();
  const weightedScore = (
    selector: (row: (typeof rows)[number]) => number | null
  ) => {
    const eligible = rows.filter((row) => selector(row) !== null);
    const eligibleValue = eligible.reduce(
      (sum, row) => sum + row.marketValue,
      0
    );
    if (eligibleValue === 0) return null;
    return Math.round(
      eligible.reduce(
        (sum, row) => sum + (selector(row) as number) * row.marketValue,
        0
      ) / eligibleValue
    );
  };

  for (const row of rows) {
    sectors.set(row.sector, (sectors.get(row.sector) ?? 0) + row.marketValue);
  }

  return {
    generatedAt: new Date().toISOString(),
    totalValue,
    totalCost: totalCost || null,
    unrealizedGain: totalCost ? totalValue - totalCost : null,
    unrealizedGainPercent: totalCost ? ((totalValue - totalCost) / totalCost) * 100 : null,
    weightedQuality: weightedScore((row) => row.quality),
    weightedValuation: weightedScore((row) => row.valuation),
    weightedEventRisk: weightedScore((row) => row.eventRisk),
    holdings: rows.map((row) => ({
      ...row,
      weight: totalValue > 0 ? (row.marketValue / totalValue) * 100 : 0
    })),
    sectors: Array.from(sectors.entries()).map(([sector, value]) => ({
      sector,
      value,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0
    }))
  };
}
