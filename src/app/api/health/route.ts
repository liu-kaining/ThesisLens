import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/session";
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
  const auth = getAuthConfigStatus();
  const liveFmp =
    Boolean(process.env.FMP_API_KEY) && process.env.FMP_USE_MOCKS === "false";
  const ok =
    database.connected &&
    auth.authConfigured &&
    auth.internalTokenConfigured &&
    liveFmp;

  return NextResponse.json(
    {
      ok,
      service: "thesislens",
      database,
      cache,
      auth: {
        configured: auth.authConfigured,
        internalTokenConfigured: auth.internalTokenConfigured
      },
      fmp: {
        configured: Boolean(process.env.FMP_API_KEY),
        mode: liveFmp ? "live" : "mock"
      },
      researchSnapshots,
      syncJobs,
      timestamp: new Date().toISOString()
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" }
    }
  );
}
