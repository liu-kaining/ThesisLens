const appBaseUrl = process.env.APP_BASE_URL ?? "http://app:3000";
const intervalMs = Number(process.env.WORKER_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000);
const initialDelayMs = Number(process.env.WORKER_INITIAL_DELAY_MS ?? 10_000);
const maxWatchlistSymbols = Number(process.env.WORKER_MAX_SYMBOLS ?? 25);
const universeSyncIntervalMs = Number(
  process.env.WORKER_UNIVERSE_SYNC_INTERVAL_MS ?? 24 * 60 * 60 * 1000
);
const systemBatchSize = Number(process.env.WORKER_SYSTEM_BATCH_SIZE ?? 5);
const jobClaimLimit = Number(process.env.WORKER_JOB_CLAIM_LIMIT ?? 100);
const runOnce = process.env.WORKER_RUN_ONCE === "true";
const internalToken = process.env.INTERNAL_API_TOKEN;
let lastUniverseSyncAt = 0;
let universeIndex = 0;
const universePages = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, init) {
  const headers = new Headers(init?.headers);
  if (internalToken) headers.set("x-internal-token", internalToken);
  if (init?.body) headers.set("content-type", "application/json");
  const response = await fetch(new URL(path, appBaseUrl), {
    ...init,
    headers
  });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function waitForApp() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const health = await fetchJson("/api/health");
      if (health.ok) return;
    } catch {
      // Keep waiting.
    }
    await sleep(2_000);
  }
  throw new Error(`App did not become healthy at ${appBaseUrl}`);
}

async function syncSystemUniversesIfNeeded(force = false) {
  if (!force && Date.now() - lastUniverseSyncAt < universeSyncIntervalMs) {
    return { skipped: true, reason: "interval_not_elapsed" };
  }

  const result = await fetchJson("/api/internal/universes/sync", {
    method: "POST"
  });
  lastUniverseSyncAt = Date.now();
  return result;
}

async function enqueueSymbols(symbols, priority, source) {
  if (!symbols.length) return { symbols: 0, jobs: 0, modules: {} };
  return fetchJson("/api/internal/sync/enqueue", {
    method: "POST",
    body: JSON.stringify({ symbols, priority, source })
  });
}

async function enqueueWatchlist() {
  const watchlist = await fetchJson("/api/watchlist");
  const symbols = [
    ...new Set((watchlist.items ?? []).map((item) => item.symbol).filter(Boolean))
  ].slice(0, maxWatchlistSymbols);
  return enqueueSymbols(symbols, 300, "watchlist");
}

async function enqueueSystemUniverseRotation() {
  if (systemBatchSize <= 0) return { skipped: true, reason: "batch_disabled" };
  const overview = await fetchJson("/api/universes");
  const universes = (overview.universes ?? []).filter(
    (universe) => universe.activeCount > 0
  );
  if (!universes.length) return { skipped: true, reason: "no_universes" };

  const universe = universes[universeIndex % universes.length];
  universeIndex = (universeIndex + 1) % universes.length;
  const page = universePages.get(universe.id) ?? 1;
  const model = await fetchJson(
    `/api/universes?universe=${encodeURIComponent(universe.id)}&page=${page}&pageSize=${systemBatchSize}`
  );
  const symbols = (model.members ?? []).map((member) => member.symbol).filter(Boolean);
  const pageCount = Math.max(1, model.pagination?.pageCount ?? 1);
  universePages.set(universe.id, page >= pageCount ? 1 : page + 1);
  const queued = await enqueueSymbols(
    symbols,
    100,
    `system_universe:${universe.id}`
  );

  return {
    universeId: universe.id,
    page,
    pageCount,
    ...queued
  };
}

async function processJobs() {
  return fetchJson("/api/internal/sync/run", {
    method: "POST",
    body: JSON.stringify({ limit: jobClaimLimit })
  });
}

async function main() {
  console.log(`[worker] starting, app=${appBaseUrl}, intervalMs=${intervalMs}`);
  await sleep(initialDelayMs);
  await waitForApp();
  const initialUniverseSync = await syncSystemUniversesIfNeeded(true);
  console.log(
    JSON.stringify({
      event: "system_universe_sync",
      finishedAt: new Date().toISOString(),
      result: initialUniverseSync
    })
  );

  while (true) {
    const startedAt = new Date().toISOString();
    const universeSync = await syncSystemUniversesIfNeeded();
    const watchlistPlan = await enqueueWatchlist();
    const universePlan = await enqueueSystemUniverseRotation();
    const processing = await processJobs();
    console.log(
      JSON.stringify({
        event: "incremental_data_sync",
        startedAt,
        finishedAt: new Date().toISOString(),
        universeSync,
        watchlistPlan,
        universePlan,
        processing
      })
    );

    if (runOnce) return;
    await sleep(intervalMs);
  }
}

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
