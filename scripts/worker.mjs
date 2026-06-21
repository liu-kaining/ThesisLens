const appBaseUrl = process.env.APP_BASE_URL ?? "http://app:3000";
const intervalMs = Number(process.env.WORKER_REFRESH_INTERVAL_MS ?? 5 * 60 * 1000);
const initialDelayMs = Number(process.env.WORKER_INITIAL_DELAY_MS ?? 10_000);
const maxSymbols = Number(process.env.WORKER_MAX_SYMBOLS ?? 25);
const runOnce = process.env.WORKER_RUN_ONCE === "true";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, init) {
  const response = await fetch(new URL(path, appBaseUrl), init);
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

async function main() {
  console.log(`[worker] starting, app=${appBaseUrl}, intervalMs=${intervalMs}`);
  await sleep(initialDelayMs);
  await waitForApp();

  while (true) {
    const startedAt = new Date().toISOString();
    const results = await refreshWatchlist();
    console.log(
      JSON.stringify({
        event: "watchlist_refresh",
        startedAt,
        finishedAt: new Date().toISOString(),
        results
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

