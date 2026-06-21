import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/format";
import { getMarketModel } from "@/lib/server/market";

export default async function MarketPage() {
  const market = await getMarketModel();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">Market</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Market context for the research day.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            This page frames the current universe through quality, valuation, sector context,
            and watchlist movement. Future live FMP expansion can add index constituents,
            sector performance, treasury rates, and economic calendar feeds.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {market.companies.map((company) => (
            <Link
              key={company.symbol}
              href={`/stocks/${company.symbol}`}
              className="rounded-md border border-line bg-white p-5 shadow-sm transition hover:border-steel"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-steel">{company.symbol}</p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{company.name}</h2>
                </div>
                <span
                  className={
                    company.changePercent >= 0
                      ? "text-sm font-semibold text-moss"
                      : "text-sm font-semibold text-brick"
                  }
                >
                  {formatPercent(company.changePercent)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Price" value={formatCurrency(company.price, false)} />
                <Metric label="P/E" value={formatRatio(company.pe, "x")} />
                <Metric label="Market cap" value={formatCurrency(company.marketCap)} />
                <Metric label="Quality" value={`${company.quality}`} />
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Sector Snapshot</h2>
          <div className="mt-4 overflow-hidden rounded-md border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Names</th>
                  <th className="px-4 py-3">Avg move</th>
                  <th className="px-4 py-3">Avg quality</th>
                  <th className="px-4 py-3">Avg valuation</th>
                </tr>
              </thead>
              <tbody>
                {market.sectors.map((sector) => (
                  <tr key={sector.sector} className="border-t border-line">
                    <td className="px-4 py-4 font-semibold text-ink">{sector.sector}</td>
                    <td className="px-4 py-4">{sector.count}</td>
                    <td className="px-4 py-4">{formatPercent(sector.averageMove)}</td>
                    <td className="px-4 py-4">{sector.averageQuality}</td>
                    <td className="px-4 py-4">{sector.averageValuation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}
