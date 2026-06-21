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
    upcomingEvents: research.snapshot.upcomingEvents,
    news: research.snapshot.news,
    filings: research.snapshot.filings,
    score: research.scores.find((score) => score.scoreType === "events"),
    signals: research.signals.filter((signal) => signal.category === "events"),
    evidence: research.evidence.filter((item) =>
      ["fmp_news", "fmp_press_release", "fmp_sec_filing"].includes(item.source)
    ),
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
