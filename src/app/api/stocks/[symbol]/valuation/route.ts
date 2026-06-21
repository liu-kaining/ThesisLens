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
    quote: research.snapshot.quote,
    valuation: research.snapshot.valuation,
    priceTarget: research.snapshot.priceTarget,
    peers: research.snapshot.peers,
    score: research.scores.find((score) => score.scoreType === "valuation"),
    evidence: research.evidence.filter((item) =>
      ["fmp_enterprise_values", "fmp_price_target", "fmp_ratios", "fmp_peer"].includes(item.source)
    ),
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
