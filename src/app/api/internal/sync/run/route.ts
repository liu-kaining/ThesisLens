import { NextResponse } from "next/server";
import { processDataSyncJobs } from "@/lib/server/sync-processor";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    limit?: number;
  };
  const limit = Number.isFinite(body.limit)
    ? Math.max(1, Math.min(100, Number(body.limit)))
    : 30;
  const result = await processDataSyncJobs(limit);

  return NextResponse.json({ ok: true, ...result });
}
