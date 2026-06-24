# ThesisLens

ThesisLens is a rules-based U.S. equity research workspace powered by Financial
Modeling Prep data. It turns fundamentals, valuation, analyst expectations,
events, SEC filings, news, insider transactions, congressional disclosures, and
technical context into an evidence-backed investment thesis workflow.

The application is configured for live FMP data by default. A valid FMP key is
required for a healthy production start. Bundled mock data is available only
when `FMP_USE_MOCKS=true` is set explicitly for development or tests.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3009](http://localhost:3009).

Useful commands:

```bash
npm run typecheck
npm run lint
npm run build
npm run verify
```

After starting the production server with `npm start`, run:

```bash
npm run smoke
```

To run the refresh worker once against a local server:

```bash
WORKER_RUN_ONCE=true APP_BASE_URL=http://localhost:3000 npm run worker
```

To validate live FMP endpoint access with your Premium key:

```bash
FMP_API_KEY=your_key npm run fmp:check
```

## Docker

```bash
docker compose up --build
```

The compose stack includes:

- `app`: Next.js application.
- `postgres`: durable watchlist, thesis, and research memo persistence.
- `redis`: distributed research snapshot cache.
- `worker`: durable module-sync planner and processor for watchlist and system universes.
- Refreshing is module-based: pages serve PostgreSQL snapshots, expired modules are
  queued, and the worker merges successful FMP updates back into the snapshot.

Postgres is initialized from `db/init.sql`. Memory fallback starts empty and is
intended only for development continuity; production readiness requires Postgres.

## Environment

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Important variables:

- `FMP_API_KEY`: Financial Modeling Prep API key.
- `FMP_USE_MOCKS`: keep `false` in production. Set to `true` only for explicit development tests.
- `FMP_MIN_REQUEST_INTERVAL_MS`: minimum spacing between FMP request starts; defaults to 80 ms.
- `ADMIN_PASSPHRASE`: single-admin passphrase. Use this to enter `/admin` and rebuild access codes.
- `AUTH_SECRET`: random secret used to sign the HttpOnly session cookie.
- `AUTH_SECURE_COOKIES`: set to `true` when serving over HTTPS.
- `INTERNAL_API_TOKEN`: shared token used by the worker for protected internal API calls.
- `DATABASE_URL`: optional outside Docker. If missing/unavailable, memory fallback is used.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Docker Postgres credentials;
  they must match `DATABASE_URL`.
- `DATABASE_DISABLED`: set to `true` to force memory fallback.
- `REDIS_URL`: optional outside Docker. If missing/unavailable, memory cache fallback is used.
- `REDIS_DISABLED`: set to `true` to force memory cache fallback.
- `APP_BASE_URL`: worker target URL.
- `WORKER_REFRESH_INTERVAL_MS`: background refresh interval.
- `WORKER_MAX_SYMBOLS`: maximum personal watchlist symbols planned per cycle.
- `WORKER_UNIVERSE_SYNC_INTERVAL_MS`: system universe constituent sync interval.
- `WORKER_SYSTEM_BATCH_SIZE`: rotating system-universe symbols planned per cycle.
- `WORKER_JOB_CLAIM_LIMIT`: module jobs claimed per worker cycle.

Production requirements:

- `AUTH_SECRET` and `INTERNAL_API_TOKEN` must each contain at least 32 characters.
- `ADMIN_PASSPHRASE` must contain at least 12 characters.
- Serve the application through HTTPS and set `AUTH_SECURE_COOKIES=true`.
- Production readiness requires `FMP_USE_MOCKS=false` and a configured `FMP_API_KEY`;
  `/api/health` returns HTTP 503 when critical production configuration is missing.
- Run behind an HTTPS reverse proxy, enable automated Postgres backups, and monitor
  `/api/health` plus worker logs.
- The current authorization model is approved for a private single-tenant deployment.
  Public multi-user deployment still requires individual accounts, data ownership,
  audit logs, and per-user authorization.

## Product Docs

- [PRD](docs/PRD.md)
- [Technical Design](docs/TECHNICAL_DESIGN.md)
- [FMP Access Matrix](docs/FMP_ACCESS_MATRIX.md)
- [Verification Log](docs/VERIFICATION.md)

## Current Implementation

The current MVP includes:

- Dashboard-first experience, not a marketing landing page.
- Passphrase login gate with signed HttpOnly session cookies.
- Time-limited dynamic access codes that only admins can rebuild.
- Internal API token path for background worker refreshes.
- U.S. stock search with U.S. exchange prioritization; live mode does not inject mock results.
- Company research page.
- Watchlist page with add/remove support and optional Postgres persistence.
- Research screens for quality, expectation momentum, valuation questions, and event risk.
- Market and calendar pages with JSON APIs.
- Thesis tracker with saved thesis persistence.
- Portfolio view with manual holdings, weighted quality, valuation, and event-risk exposure.
- Alert rules with current score/price evaluation.
- Optional Redis-backed research cache with memory fallback.
- Background worker for watchlist refresh in Docker.
- Fundamental quality, valuation, expectations, events, behavior, technical,
  peer, evidence, and rules-based research memo sections.
- FMP adapter with graceful endpoint degradation.
- Deterministic evidence-backed memo generation without external model calls.
- Dockerfile and Docker Compose.

Key routes:

- `/`
- `/watchlist`
- `/screens`
- `/portfolio`
- `/theses`
- `/alerts`
- `/market`
- `/calendar`
- `/admin`
- `/settings`
- `/stocks/AAPL`
- `/api/health`
- `/api/internal/fmp-health`
- `/api/internal/refresh/AAPL`
- `/api/internal/recompute/AAPL`

This product is for research and education only. It is not investment advice.
