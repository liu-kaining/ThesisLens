const appBaseUrl = process.env.APP_BASE_URL ?? "http://app:3000";
const intervalMs = Number(process.env.WORKER_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000);
const initialDelayMs = Number(process.env.WORKER_INITIAL_DELAY_MS ?? 10_000);
const maxSymbols = Number(process.env.WORKER_MAX_SYMBOLS ?? 25);
const universeSyncIntervalMs = Number(process.env.WORKER_UNIVERSE_SYNC_INTERVAL_MS ?? 24 * 60 * 60 * 1000);
const maxUniverseSymbols = Number(process.env.WORKER_UNIVERSE_PREHEAT_SYMBOLS ?? 20);
const runOnce = process.env.WORKER_RUN_ONCE === "true";
const internalToken = process.env.INTERNAL_API_TOKEN;
let lastUniverseSyncAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, init) {
  const headers = new Headers(init?.headers);
  if (internalToken) headers.set("x-internal-token", internalToken);
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

async function refreshWatchlist() {
  const watchlist = await fetchJson("/api/watchlist");
  const symbols = [...new Set((watchlist.items ?? []).map((item) => item.symbol).filter(Boolean))].slice(
    0,
    maxSymbols
  );

  return refreshSymbols(symbols);
}

async function refreshSymbols(symbols) {
  const results = [];

  for (const symbol of symbols) {
    try {
      const result = await fetchJson(`/api/internal/refresh/${encodeURIComponent(symbol)}`, {
        method: "POST"
      });
      results.push({ symbol, ok: true, mode: result.mode, signalCount: result.signalCount });
    } catch (error) {
      results.push({
        symbol,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown refresh error"
      });
    }
  }

  return results;
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

async function refreshSystemUniverseSample() {
  if (maxUniverseSymbols <= 0) return [];

  const model = await fetchJson("/api/universes");
  const symbols = [];
  const seen = new Set();
  for (const group of model.membersByUniverse ?? []) {
    for (const member of group.members ?? []) {
      if (symbols.length >= maxUniverseSymbols) break;
      if (!member.symbol || seen.has(member.symbol)) continue;
      seen.add(member.symbol);
      symbols.push(member.symbol);
    }
    if (symbols.length >= maxUniverseSymbols) break;
  }

  return refreshSymbols(symbols);
}

async function main() {
  console.log(`[worker] starting, app=${appBaseUrl}, intervalMs=${intervalMs}`);
  await sleep(initialDelayMs);
  await waitForApp();
  const initialUniverseSync = await syncSystemUniversesIfNeeded(true);
  console.log(
    JSON.stringify({
      event: "system_universe_sync",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      result: initialUniverseSync
    })
  );

  while (true) {
    const startedAt = new Date().toISOString();
    const universeSync = await syncSystemUniversesIfNeeded();
    const watchlistResults = await refreshWatchlist();
    const universeResults = await refreshSystemUniverseSample();
    console.log(
      JSON.stringify({
        event: "watchlist_refresh",
        startedAt,
        finishedAt: new Date().toISOString(),
        universeSync,
        watchlistResults,
        universeResults
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
