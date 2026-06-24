import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/server/cache";
import { getCompanyResearchSnapshotStats, getDatabaseHealth } from "@/lib/server/db";

export async function GET() {
  const [database, cache, researchSnapshots] = await Promise.all([
    getDatabaseHealth(),
    getCacheStats(),
    getCompanyResearchSnapshotStats()
  ]);

  return NextResponse.json({
    ok: true,
    service: "thesislens",
    database,
    cache,
    researchSnapshots,
    timestamp: new Date().toISOString()
  });
}
