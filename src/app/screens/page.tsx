import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { formatCurrency, formatPercent } from "@/lib/format";
import { directionLabel } from "@/lib/labels";
import { getResearchScreens } from "@/lib/server/screens";
import type { Direction } from "@/lib/types";

const directionClass: Record<Direction, string> = {
  positive: "border-moss bg-[#f2f6ec] text-moss",
  negative: "border-brick bg-[#fff1ef] text-brick",
  neutral: "border-line bg-white text-muted",
  mixed: "border-amber bg-[#fff7e8] text-amber"
};

export default async function ScreensPage() {
  const model = await getResearchScreens();
  const hasResults = model.screens.some((screen) => screen.results.length > 0);

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">研究选股器</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            不只筛因子，还要筛解释。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            每个选股器都只扫描观察列表中的研究宇宙。当前覆盖 {model.universe.count} 家公司，
            用 ThesisLens 分数和证据信号找出值得继续研究的问题。
          </p>
        </section>

        {model.universe.isEmpty ? (
          <EmptyUniverse />
        ) : null}

        <div className="grid gap-6">
          {model.screens.map((screen) => (
            <section key={screen.id} className="rounded-md border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{screen.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{screen.description}</p>
                </div>
                <span className="rounded bg-canvas px-2 py-1 text-xs font-semibold text-muted">
                  {screen.results.length} 个标的
                </span>
              </div>

              {screen.results.length ? (
                <div className="mt-4 overflow-hidden rounded-md border border-line">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-3">代码</th>
                        <th className="hidden px-4 py-3 md:table-cell">Thesis 问题</th>
                        <th className="px-4 py-3">价格</th>
                        <th className="px-4 py-3">质量</th>
                        <th className="px-4 py-3">估值</th>
                        <th className="px-4 py-3">预期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {screen.results.map((result) => (
                        <tr key={`${screen.id}-${result.symbol}`} className="border-t border-line">
                          <td className="px-4 py-4">
                            <Link
                              href={`/stocks/${result.symbol}`}
                              className="font-semibold text-steel hover:text-ink"
                            >
                              {result.symbol}
                            </Link>
                            <p className="max-w-44 truncate text-xs text-muted">{result.name}</p>
                            <span
                              className={`mt-2 inline-block rounded border px-2 py-1 text-xs ${
                                directionClass[result.direction]
                              }`}
                            >
                              {directionLabel(result.direction)}
                            </span>
                          </td>
                          <td className="hidden max-w-xl px-4 py-4 leading-6 text-muted md:table-cell">
                            {result.thesis}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium">{formatCurrency(result.price, false)}</p>
                            <p
                              className={
                                (result.changePercent ?? 0) >= 0
                                  ? "text-xs text-moss"
                                  : "text-xs text-brick"
                              }
                            >
                              {formatPercent(result.changePercent)}
                            </p>
                          </td>
                          <td className="px-4 py-4 font-semibold">{result.quality}</td>
                          <td className="px-4 py-4 font-semibold">{result.valuation}</td>
                          <td className="px-4 py-4 font-semibold">{result.expectations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-line bg-canvas p-4 text-sm leading-6 text-muted">
                  当前观察列表里没有符合这个筛选器的标的。
                </div>
              )}
            </section>
          ))}
        </div>

        {!model.universe.isEmpty && !hasResults ? (
          <p className="text-sm leading-6 text-muted">
            观察列表已有标的，但暂时没有命中高质量或预期动量等筛选条件；可以进入公司页查看原始数据。
          </p>
        ) : null}
      </div>
    </main>
  );
}

function EmptyUniverse() {
  return (
    <section className="rounded-md border border-dashed border-line bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">研究宇宙为空</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        先在观察列表中加入股票代码，选股器会自动基于这些标的重新计算。
      </p>
      <Link
        href="/watchlist"
        className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-steel"
      >
        打开观察列表
      </Link>
    </section>
  );
}
