import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth/session";
import { getCacheStats } from "@/lib/server/cache";
import {
  getCompanyResearchSnapshotStats,
  getDataSyncJobStats,
  getDatabaseHealth,
  getSystemUniverses
} from "@/lib/server/db";
import { isPlausibleSystemUniverseUpdate } from "@/lib/server/system-universes";

export async function GET() {
  const [database, cache, researchSnapshots, syncJobs, systemUniverses] = await Promise.all([
    getDatabaseHealth(),
    getCacheStats(),
    getCompanyResearchSnapshotStats(),
    getDataSyncJobStats(),
    getSystemUniverses()
  ]);
  const auth = getAuthConfigStatus();
  const liveFmp =
    Boolean(process.env.FMP_API_KEY) && process.env.FMP_USE_MOCKS === "false";
  const cacheRequired =
    Boolean(process.env.REDIS_URL) && process.env.REDIS_DISABLED !== "true";
  const ok =
    database.connected &&
    (!cacheRequired || cache.connected) &&
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
      systemUniverses: {
        healthy:
          systemUniverses.length > 0 &&
          systemUniverses.every((universe) =>
            isPlausibleSystemUniverseUpdate(
              universe.id,
              universe.activeCount,
              universe.activeCount
            )
          ),
        counts: Object.fromEntries(
          systemUniverses.map((universe) => [universe.id, universe.activeCount])
        ),
        oldestRefreshAt: systemUniverses
          .map((universe) => universe.refreshedAt)
          .filter((value): value is string => Boolean(value))
          .sort()[0] ?? null
      },
      timestamp: new Date().toISOString()
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" }
    }
  );
}
