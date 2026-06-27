# Verification Log

Last verified: 2026-06-27

## Production Recheck (2026-06-27)

An independent recheck found and corrected data-integrity issues that were not
covered by the previous smoke suite:

- SPY and QQQ membership refreshes now reject implausible payloads and fall back
  to index constituents without deactivating the last valid universe snapshot.
- The live database was restored to 503 SPY members and 101 QQQ members.
- SMA50, SMA200, and RSI are calculated from 420 calendar days of actual price
  history. Approximate indicator placeholders were removed.
- Fixed 50% historical and peer P/E percentile placeholders were removed from
  live normalization and all 521 persisted snapshots.
- Empty analytical payloads are no longer labeled as live data or converted
  into default quality, valuation, expectations, technical, or behavior scores.
- A successful empty FMP response is recorded as checked-with-no-data and does
  not consume repeated queue retries.
- Stored derived scores and signals self-heal on read when the rules change,
  without making another FMP request.
- Dashboard market commentary was replaced with objective watchlist statistics.
- Redis retries after transient failures, and configured Redis connectivity is
  now part of production health.
- PostgreSQL snapshot and module-state write failures are no longer silently
  reported as successful in-memory writes.
- The local Docker build was restored to the standard `node:22-alpine` base;
  the application image was reduced from roughly 3.53 GB to 339 MB.

Final checks:

- `npm run verify`: 14 test files and 31 tests passed.
- `npm audit --omit=dev`: zero production dependency vulnerabilities.
- Docker Compose app, Postgres, and Redis services reported healthy.
- Live FMP mode, Postgres persistence, Redis cache, and all five system
  universes reported healthy.
- Queue state returned zero queued, running, and failed jobs.
- Runtime smoke covered authentication, dashboard, company APIs, universes,
  screens, market, calendar, portfolio, theses, and alerts.
- Authorization checks confirmed that session cookies cannot call internal APIs,
  invalid worker tokens are rejected, and worker tokens cannot write user data.

## Production Readiness Review (2026-06-24)

The private, single-tenant deployment profile passed the final CTO review.
The following checks were completed against the live Docker Compose stack:

- `npm run verify`: 14 test files and 26 tests passed, followed by a successful
  production build.
- `npm audit --omit=dev`: zero production dependency vulnerabilities.
- `SMOKE_BASE_URL=http://localhost:3009 npm run smoke`: authentication, health,
  dashboard, company research APIs, universes, screens, market, calendar,
  portfolio, theses, and alerts all passed.
- App, Postgres, and Redis containers reported healthy status.
- Health API reported live FMP mode, connected Postgres and Redis, 57 persisted
  research snapshots, and no queued, running, or failed sync jobs.
- The incremental worker completed 34 module jobs across 12 companies with zero
  failures.
- Live database inspection found no mock research snapshots and no historical
  seeded thesis, holding, or alert records.
- A fresh Postgres database successfully initialized the snapshot, module,
  queue, thesis, holding, and alert tables.
- Viewer sessions were denied access to internal APIs. The internal worker token
  was limited to internal routes plus read-only planning data and could not
  write user data.
- Login rate limiting, session expiration, request validation, security headers,
  queue retry cooldown, and concurrent FMP endpoint accounting are covered by
  automated tests.

Approval scope:

- Approved for a private deployment with a shared research data space.
- A public multi-user service still requires user accounts, row ownership,
  per-user authorization, audit logs, and tenant isolation.
- Production operations must provide HTTPS, secure cookies, managed database
  backups, monitoring, and confirmed FMP redistribution/display rights.

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
