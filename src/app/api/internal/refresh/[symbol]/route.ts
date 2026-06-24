import { NextResponse } from "next/server";
import { allDataModuleKeys, isDataModuleKey } from "@/lib/data-modules";
import { refreshCompanyResearch } from "@/lib/server/research";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    modules?: string[];
  };
  const modules = Array.isArray(body.modules)
    ? body.modules.filter(isDataModuleKey)
    : allDataModuleKeys();
  const research = await refreshCompanyResearch(symbol, modules);

  return NextResponse.json({
    ok: true,
    symbol: research.snapshot.profile.symbol,
    refreshedAt: research.snapshot.dataStatus.refreshedAt,
    mode: research.snapshot.dataStatus.mode,
    modules,
    signalCount: research.signals.length,
    evidenceCount: research.evidence.length
  });
}
