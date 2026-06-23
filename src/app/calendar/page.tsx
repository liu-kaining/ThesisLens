import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { dateShort } from "@/lib/format";
import { severityLabel } from "@/lib/labels";
import type { Severity } from "@/lib/types";
import { getCalendarEvents } from "@/lib/server/calendar";

export default async function CalendarPage() {
  const calendar = await getCalendarEvents();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">日历</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            催化剂、SEC 文件和 thesis 检查点。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            ThesisLens 把观察列表里的日历事件当作 thesis 压力测试。当前覆盖{" "}
            {calendar.universe.count} 家公司；财报、SEC 文件和公告都应该对应到具体问题。
          </p>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {calendar.events.map((event) => (
              <Link
                key={`${event.symbol}-${event.id}`}
                href={`/stocks/${event.symbol}`}
                className="grid gap-3 rounded-md border border-line p-4 transition hover:border-steel md:grid-cols-[9rem_1fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{dateShort(event.date)}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted">{event.type}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-steel">{event.symbol} · {event.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{event.detail}</p>
                </div>
                <span className="h-fit rounded border border-line px-2 py-1 text-xs text-muted">
                  风险 {severityLabel(event.severity as Severity)}
                </span>
              </Link>
            ))}
            {calendar.events.length === 0 ? (
              <div className="rounded-md border border-dashed border-line bg-canvas p-5">
                <h2 className="text-sm font-semibold text-ink">
                  {calendar.universe.isEmpty ? "日历研究池为空" : "暂无近期事件"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {calendar.universe.isEmpty
                    ? "先在观察列表中加入股票代码，日历会自动汇总这些公司的财报、SEC 文件和事件。"
                    : "当前观察列表里没有可展示的近期事件；可以进入公司页查看完整新闻和文件。"}
                </p>
                {calendar.universe.isEmpty ? (
                  <Link
                    href="/watchlist"
                    className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-steel"
                  >
                    打开观察列表
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
