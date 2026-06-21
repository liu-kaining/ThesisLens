import { NextResponse } from "next/server";
import { getCompanyResearch } from "@/lib/server/research";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const research = await getCompanyResearch(symbol);

  return NextResponse.json({
    symbol: research.snapshot.profile.symbol,
    analystEstimates: research.snapshot.analystEstimates,
    rating: research.snapshot.rating,
    priceTarget: research.snapshot.priceTarget,
    score: research.scores.find((score) => score.scoreType === "expectations"),
    signals: research.signals.filter((signal) => signal.category === "expectations"),
    evidence: research.evidence.filter((item) =>
      ["fmp_analyst_estimates", "fmp_price_target", "fmp_rating"].includes(item.source)
    ),
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
