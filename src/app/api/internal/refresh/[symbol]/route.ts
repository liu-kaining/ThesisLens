import { NextResponse } from "next/server";
import { refreshCompanyResearch } from "@/lib/server/research";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const research = await refreshCompanyResearch(symbol);

  return NextResponse.json({
    ok: true,
    symbol: research.snapshot.profile.symbol,
    refreshedAt: research.snapshot.dataStatus.refreshedAt,
    mode: research.snapshot.dataStatus.mode,
    signalCount: research.signals.length,
    evidenceCount: research.evidence.length
  });
}

