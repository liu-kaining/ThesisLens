# ThesisLens

ThesisLens is a rules-based U.S. equity research workspace powered by Financial
Modeling Prep data. It turns fundamentals, valuation, analyst expectations,
events, SEC filings, news, insider transactions, congressional disclosures, and
technical context into an evidence-backed investment thesis workflow.

The app runs with bundled demo data by default, so it can be explored without
API keys. Add a FMP key to use live data.

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
- `worker`: background watchlist refresh loop.

Postgres is initialized from `db/init.sql`. If Postgres is unavailable, the app
falls back to an in-memory demo watchlist so the research experience still runs.

## Environment

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Important variables:

- `FMP_API_KEY`: Financial Modeling Prep API key.
- `FMP_USE_MOCKS`: `true` by default. Set to `false` to use live FMP data.
- `ADMIN_PASSPHRASE`: single-admin passphrase. Use this to enter `/admin` and rebuild access codes.
- `AUTH_SECRET`: random secret used to sign the HttpOnly session cookie.
- `AUTH_SECURE_COOKIES`: set to `true` when serving over HTTPS.
- `INTERNAL_API_TOKEN`: shared token used by the worker for protected internal API calls.
- `DATABASE_URL`: optional outside Docker. If missing/unavailable, memory fallback is used.
- `DATABASE_DISABLED`: set to `true` to force memory fallback.
- `REDIS_URL`: optional outside Docker. If missing/unavailable, memory cache fallback is used.
- `REDIS_DISABLED`: set to `true` to force memory cache fallback.
- `APP_BASE_URL`: worker target URL.
- `WORKER_REFRESH_INTERVAL_MS`: background refresh interval.

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
- U.S. stock search with live/mock data fallback and U.S. exchange prioritization.
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
