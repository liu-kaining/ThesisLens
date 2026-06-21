# FMP Access Matrix

This file records the planned FMP Premium endpoint coverage for ThesisLens and
the current implementation status. Live access should be validated with the
actual `FMP_API_KEY` before relying on a module in production.

Run:

```bash
FMP_API_KEY=your_key npm run fmp:check
```

Runtime notes:

- Live FMP calls go through `src/lib/server/fmp.ts`.
- Critical responses are runtime-validated with Zod before normalization.
- `/api/internal/fmp-health` exposes endpoint telemetry after live calls,
  including status, latency, response byte size, item count, and last error.
- In mock mode, endpoint telemetry remains empty because no live FMP requests
  are made.
- Adapter live-path behavior is covered by unit tests with mocked FMP
  responses, including successful search mapping, schema validation fallback,
  mixed snapshot fallback, and telemetry recording.

| Domain | ThesisLens module | Implemented | Live access validated |
| --- | --- | --- | --- |
| Profile | Company header, search fallback | Yes | No key available |
| Quote | Header, dashboard, price change evidence | Yes | No key available |
| Income statement | Fundamentals and quality score | Yes | No key available |
| Balance sheet | Balance sheet score | Yes | No key available |
| Cash flow statement | Cash flow score | Yes | No key available |
| Ratios | Profitability and valuation score | Yes | No key available |
| Key metrics | Valuation and cash-flow context | Yes | No key available |
| Financial scores | Piotroski and Altman evidence | Yes | No key available |
| Analyst estimates | Expectations score and memo | Yes | No key available |
| Price target consensus | Valuation and expectations | Yes | No key available |
| Ratings snapshot | Expectations module | Yes | No key available |
| DCF / levered DCF | Valuation setup | Yes | No key available |
| Stock news | Event/news timeline | Yes | No key available |
| Press releases | Event/news timeline | Yes | No key available |
| SEC filings by symbol | Filing timeline | Yes | No key available |
| Insider trading | Behavior module | Yes | No key available |
| Senate trading | Behavior module | Yes | No key available |
| House trading | Behavior module | Yes | No key available |
| Historical EOD | Technical chart fallback | Yes | No key available |
| Stock peers | Peer position | Yes | No key available |
| 13F institutional holdings | Future Ultimate expansion | No | Likely Ultimate |
| ETF / mutual fund holdings | Future Ultimate expansion | No | Likely Ultimate |
| Earnings call transcripts | Future Ultimate expansion | No | Likely Ultimate |
| Bulk / batch endpoints | Future ingestion optimization | No | Likely Ultimate |
