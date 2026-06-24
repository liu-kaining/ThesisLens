import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/server/cache";
import {
  getCompanyResearchSnapshotStats,
  getDataSyncJobStats,
  getDatabaseHealth
} from "@/lib/server/db";

export async function GET() {
  const [database, cache, researchSnapshots, syncJobs] = await Promise.all([
    getDatabaseHealth(),
    getCacheStats(),
    getCompanyResearchSnapshotStats(),
    getDataSyncJobStats()
  ]);

  return NextResponse.json({
    ok: true,
    service: "thesislens",
    database,
    cache,
    researchSnapshots,
    syncJobs,
    timestamp: new Date().toISOString()
  });
}
