# Verification Log

Last verified: 2026-06-21

## Local Node Verification

The following command passed:

```bash
npm run verify
```

This runs:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

The automated test suite currently covers:

- Signal/evidence scoring continuity.
- FMP adapter live-path mapping, Zod validation fallback, and endpoint telemetry.
- Deterministic AI memo generation when OpenAI is disabled.
- OpenAI memo JSON schema validation, evidence filtering, and deterministic fallback.
- Mock-backed company research service behavior.
- Watchlist daily what-changed badge enrichment.
- Portfolio enrichment and weighting.
- Alert rule evaluation.

Vitest result:

```text
Test Files  8 passed (8)
Tests       12 passed (12)
```

The production build generated these app surfaces:

- `/`
- `/watchlist`
- `/screens`
- `/portfolio`
- `/theses`
- `/alerts`
- `/market`
- `/calendar`
- `/settings`
- `/stocks/[symbol]`
- `/api/health`
- `/api/internal/fmp-health`
- `/api/search`
- `/api/stocks/[symbol]/snapshot`
- `/api/stocks/[symbol]/fundamentals`
- `/api/stocks/[symbol]/valuation`
- `/api/stocks/[symbol]/expectations`
- `/api/stocks/[symbol]/events`
- `/api/stocks/[symbol]/behavior`
- `/api/stocks/[symbol]/memo`
- `/api/watchlist`
- `/api/watchlist/items/[symbol]`
- `/api/portfolio`
- `/api/portfolio/items/[symbol]`
- `/api/theses`
- `/api/theses/[id]`
- `/api/alerts`
- `/api/alerts/[id]`
- `/api/screens`
- `/api/market`
- `/api/calendar`
- `/api/internal/refresh/[symbol]`
- `/api/internal/recompute/[symbol]`

## Runtime Smoke Test

After:

```bash
PORT=3001 npm start
```

The following command passed:

```bash
SMOKE_BASE_URL=http://localhost:3001 npm run smoke
```

Covered checks:

- Health API.
- Dashboard HTML.
- Company page HTML.
- Company snapshot API.
- Company fundamentals, valuation, expectations, events, and behavior APIs.
- Watchlist API.
- Screens API.
- Market API.
- Calendar API.
- Portfolio page and API.
- Thesis tracker page and API.
- Alerts page and API.

Worker check passed against the local production server:

```bash
WORKER_RUN_ONCE=true WORKER_INITIAL_DELAY_MS=0 APP_BASE_URL=http://localhost:3001 npm run worker
```

Observed result:

- AAPL refreshed successfully.
- MSFT refreshed successfully.
- NVDA refreshed successfully.
- All returned mock mode with computed signals.

Health API now reports both database and cache state. Without local Postgres or
Redis env vars, it correctly reports memory fallback for both.

Additional manual API checks passed:

```bash
curl -s -X POST http://localhost:3001/api/internal/refresh/AAPL
curl -s -X POST http://localhost:3001/api/internal/recompute/MSFT
```

The recompute endpoint was also checked to ensure every returned signal has
deduplicated evidence IDs.

The watchlist API was checked to ensure each monitored stock returns seven
daily what-changed badges: price, fundamentals, estimates, events, filings,
insider/congress behavior, and technical context.

The memo API was checked to ensure every required memo section returns evidence
IDs after schema validation and post-processing.

The FMP health endpoint was checked in mock mode. It correctly reports mock
mode and an empty endpoint telemetry list when no live FMP key is configured.
Live FMP calls record endpoint status, latency, response byte size, and last
error through the FMP adapter.

## Security Audit

The following command returned zero vulnerabilities:

```bash
npm audit --json
```

## FMP Access Check

The following command runs and exits successfully without a key, reporting that
live validation is skipped:

```bash
npm run fmp:check
```

To validate actual Premium access:

```bash
FMP_API_KEY=your_key npm run fmp:check
```

## Docker Verification

The following command passed:

```bash
docker compose config
```

This validates the four-service stack:

- `app`
- `worker`
- `postgres`
- `redis`

Postgres initialization was also verified with the official `postgres:16-alpine`
image and `db/init.sql`. The schema check confirmed all 21 core tables were
created, including normalized data tables, evidence, signals, company scores,
AI memos, watchlists, theses, portfolio holdings, and alert rules.

The following command passed:

```bash
docker compose build app worker
```

Docker app runtime smoke test passed:

```bash
docker run -d --rm --name thesislens-smoke -p 3002:3000 thesislens-app:latest
SMOKE_BASE_URL=http://localhost:3002 npm run smoke
docker stop thesislens-smoke
```

Docker worker runtime check passed against the Docker app container:

```bash
docker run --rm \
  -e APP_BASE_URL=http://host.docker.internal:3002 \
  -e WORKER_RUN_ONCE=true \
  -e WORKER_INITIAL_DELAY_MS=0 \
  thesislens-worker:latest \
  node scripts/worker.mjs
```

The Docker app container also passed the same recompute evidence-ID
deduplication check against `http://localhost:3002`, plus the watchlist
what-changed badge structure check and memo section evidence check.

Notes:

- Local port `3000` was occupied by another running Docker container, so app runtime smoke used host port `3002`.
- Full `docker compose up --build` should be run when port `3000` is free, or the compose port mapping is adjusted.
- If Docker maps the app to another host/port, pass:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```
