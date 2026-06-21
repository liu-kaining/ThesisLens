import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  FileText,
  LineChart,
  Radar
} from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { SearchBox } from "@/components/search-box";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DashboardModel, Direction } from "@/lib/types";

type DashboardProps = {
  model: DashboardModel;
};

const directionStyles: Record<Direction, string> = {
  positive: "border-moss bg-[#f2f6ec] text-moss",
  negative: "border-brick bg-[#fff1ef] text-brick",
  neutral: "border-line bg-white text-muted",
  mixed: "border-amber bg-[#fff7e8] text-amber"
};

export function Dashboard({ model }: DashboardProps) {
  return (
    <main className="min-h-screen bg-canvas">
      <AppNav />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between gap-6 rounded-md border border-line bg-white p-6 shadow-sm">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-steel">
                <Radar className="h-4 w-4" />
                U.S. equity research workspace
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                Build an evidence-backed thesis before the market gives you an opinion.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                ThesisLens turns FMP fundamentals, valuation, estimates, filings, news,
                insider activity, congressional disclosures, and technical context into a
                research workflow you can inspect.
              </p>
            </div>
            <SearchBox />
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {model.marketPulse.map((item) => (
              <div key={item.label} className="rounded-md border border-line bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
                  <span className={`rounded border px-2 py-1 text-xs ${directionStyles[item.direction]}`}>
                    {item.direction}
                  </span>
                </div>
                <p className="text-lg font-semibold text-ink">{item.value}</p>
                <p className="mt-2 text-sm leading-5 text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <SectionTitle icon={<Activity className="h-4 w-4" />} title="Watchlist Changes" />
            <div className="mt-4 overflow-hidden rounded-md border border-line">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Company</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Move</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Top Signal</th>
                    <th className="px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {model.watchlist.map((item) => (
                    <tr key={item.symbol} className="border-t border-line">
                      <td className="px-4 py-4">
                        <Link
                          href={`/stocks/${item.symbol}`}
                          className="inline-flex items-center gap-1 font-semibold text-steel hover:text-ink"
                        >
                          {item.symbol}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                      <td className="hidden max-w-56 truncate px-4 py-4 text-muted sm:table-cell">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(item.price, false)}</td>
                      <td
                        className={`px-4 py-4 font-semibold ${
                          item.changePercent >= 0 ? "text-moss" : "text-brick"
                        }`}
                      >
                        {formatPercent(item.changePercent)}
                      </td>
                      <td className="hidden max-w-xl px-4 py-4 text-muted lg:table-cell">
                        {item.topSignal}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded bg-ink px-2 py-1 text-xs font-semibold text-white">
                          {item.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <SectionTitle icon={<LineChart className="h-4 w-4" />} title="Research Candidates" />
            <div className="mt-4 flex flex-col gap-3">
              {model.researchIdeas.map((idea) => (
                <Link
                  key={idea.symbol}
                  href={`/stocks/${idea.symbol}`}
                  className="rounded-md border border-line p-4 transition hover:border-steel hover:bg-canvas"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-steel">{idea.symbol}</p>
                      <h3 className="mt-1 text-base font-semibold text-ink">{idea.title}</h3>
                    </div>
                    <span className={`rounded border px-2 py-1 text-xs ${directionStyles[idea.direction]}`}>
                      {idea.direction}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted">{idea.thesis}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Capability icon={<BarChart3 className="h-5 w-5" />} title="Fundamentals" text="Statements, ratios, scores, owner-earnings style cash-flow view." />
          <Capability icon={<CircleDollarSign className="h-5 w-5" />} title="Valuation" text="DCF, multiples, peer context, historical percentile, target gap." />
          <Capability icon={<FileText className="h-5 w-5" />} title="Filings & Events" text="SEC filings, news, press releases, earnings calendar, catalysts." />
          <Capability icon={<CalendarClock className="h-5 w-5" />} title="Behavior Signals" text="Insider transactions and Senate/House disclosures as context." />
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="text-steel">{icon}</span>
      {title}
    </div>
  );
}

function Capability({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 text-steel">{icon}</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-muted">{text}</p>
    </div>
  );
}
