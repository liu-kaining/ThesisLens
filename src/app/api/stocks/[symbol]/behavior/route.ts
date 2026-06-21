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
    insiders: research.snapshot.insiders,
    congress: research.snapshot.congress,
    score: research.scores.find((score) => score.scoreType === "behavior"),
    signals: research.signals.filter((signal) => signal.category === "behavior"),
    evidence: research.evidence.filter((item) =>
      ["fmp_insider", "fmp_congress"].includes(item.source)
    ),
    disclaimer:
      "Insider and congressional disclosures are delayed context signals, not real-time trading intent or standalone investment advice.",
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
