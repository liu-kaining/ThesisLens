import type { DataModuleKey } from "@/lib/data-modules";
import {
  claimDataSyncJobs,
  finishDataSyncJobs,
  type DataSyncJobRecord
} from "@/lib/server/db";
import { refreshCompanyResearch } from "@/lib/server/research";

export async function processDataSyncJobs(limit = 30) {
  const claimed = await claimDataSyncJobs(limit);
  const groups = new Map<string, DataSyncJobRecord[]>();

  for (const job of claimed) {
    const existing = groups.get(job.symbol) ?? [];
    existing.push(job);
    groups.set(job.symbol, existing);
  }

  const results = [];
  for (const [symbol, jobs] of groups) {
    const modules = Array.from(
      new Set(jobs.map((job) => job.moduleKey))
    ) as DataModuleKey[];

    try {
      const research = await refreshCompanyResearch(symbol, modules);
      const moduleStates = new Map(
        (research.snapshot.dataStatus.modules ?? []).map((module) => [
          module.key,
          module
        ])
      );
      const succeeded = jobs.filter((job) => {
        const state = moduleStates.get(job.moduleKey);
        return (
          state?.status === "live" ||
          state?.status === "mock" ||
          state?.attemptStatus === "success"
        );
      });
      const failed = jobs.filter((job) => !succeeded.includes(job));

      await finishDataSyncJobs(succeeded, { ok: true });
      if (failed.length) {
        await finishDataSyncJobs(failed, {
          ok: false,
          error: failed
            .map((job) => {
              const state = moduleStates.get(job.moduleKey);
              return `${job.moduleKey}: ${state?.detail ?? "FMP 未返回可用数据"}`;
            })
            .join("; ")
        });
      }
      results.push({
        symbol,
        modules,
        completed: succeeded.length,
        failed: failed.length
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown module refresh error";
      await finishDataSyncJobs(jobs, { ok: false, error: message });
      results.push({
        symbol,
        modules,
        completed: 0,
        failed: jobs.length,
        error: message
      });
    }
  }

  return {
    claimed: claimed.length,
    companies: groups.size,
    results
  };
}
