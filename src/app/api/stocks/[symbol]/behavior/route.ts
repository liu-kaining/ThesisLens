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
      "内幕交易和国会交易披露存在延迟，只能作为背景信号，不代表实时交易意图，也不能单独构成投资建议。",
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
