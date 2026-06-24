import {
  DATA_MODULES,
  getDataModuleDefinition,
  type DataModuleKey
} from "@/lib/data-modules";
import {
  enqueueDataSyncJobs,
  getCompanyDataModuleStates
} from "@/lib/server/db";

export async function getDueDataModules(symbol: string): Promise<DataModuleKey[]> {
  const states = await getCompanyDataModuleStates(symbol);
  const stateMap = new Map(states.map((state) => [state.moduleKey, state]));
  const now = Date.now();

  return DATA_MODULES.filter((module) => {
    const state = stateMap.get(module.key);
    if (!state) return true;
    if (state.status === "stale" || state.status === "unavailable") return true;
    if (!state.expiresAt) return true;
    return new Date(state.expiresAt).getTime() <= now;
  }).map((module) => module.key);
}

export async function enqueueDueDataSync(
  symbols: string[],
  priority: number,
  source: string
) {
  const normalizedSymbols = Array.from(
    new Set(
      symbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    )
  );
  const jobs = (
    await Promise.all(
      normalizedSymbols.map(async (symbol) => {
        const dueModules = await getDueDataModules(symbol);
        return dueModules.map((moduleKey) => ({
          symbol,
          moduleKey,
          priority: priority + getDataModuleDefinition(moduleKey).priority,
          source
        }));
      })
    )
  ).flat();

  await enqueueDataSyncJobs(jobs);

  return {
    symbols: normalizedSymbols.length,
    jobs: jobs.length,
    modules: jobs.reduce<Partial<Record<DataModuleKey, number>>>((counts, job) => {
      counts[job.moduleKey] = (counts[job.moduleKey] ?? 0) + 1;
      return counts;
    }, {})
  };
}
