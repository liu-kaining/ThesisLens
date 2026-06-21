"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { PortfolioModel } from "@/lib/server/portfolio";

export function PortfolioClient({ initialPortfolio }: { initialPortfolio: PortfolioModel }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          shares: Number(shares),
          averageCost: averageCost ? Number(averageCost) : null,
          notes
        })
      });
      setPortfolio((await response.json()) as PortfolioModel);
      setSymbol("");
      setShares("");
      setAverageCost("");
      setNotes("");
    });
  }

  function remove(symbolToRemove: string) {
    startTransition(async () => {
      const response = await fetch(`/api/portfolio/items/${encodeURIComponent(symbolToRemove)}`, {
        method: "DELETE"
      });
      setPortfolio((await response.json()) as PortfolioModel);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={submit} className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">添加持仓</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            股票代码
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            股数
            <input value={shares} onChange={(event) => setShares(event.target.value)} type="number" min="0" step="0.0001" className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel" />
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          平均成本
          <input value={averageCost} onChange={(event) => setAverageCost(event.target.value)} type="number" min="0" step="0.01" className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel" />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          备注
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-steel" />
        </label>
        <button type="submit" disabled={isPending} className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-60">
          {isPending ? "更新中..." : "保存持仓"}
        </button>
      </form>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="市值" value={formatCurrency(portfolio.totalValue)} />
          <Metric label="盈亏" value={formatCurrency(portfolio.unrealizedGain)} />
          <Metric label="质量" value={`${portfolio.weightedQuality}`} />
          <Metric label="事件风险" value={`${portfolio.weightedEventRisk}`} />
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">持仓</th>
                <th className="px-4 py-3">权重</th>
                <th className="px-4 py-3">市值</th>
                <th className="hidden px-4 py-3 md:table-cell">信号</th>
                <th className="px-4 py-3" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr key={holding.symbol} className="border-t border-line">
                  <td className="px-4 py-4">
                    <Link href={`/stocks/${holding.symbol}`} className="font-semibold text-steel hover:text-ink">
                      {holding.symbol}
                    </Link>
                    <p className="text-xs text-muted">{holding.shares} 股 · {formatPercent(holding.unrealizedGainPercent)}</p>
                  </td>
                  <td className="px-4 py-4">{formatPercent(holding.weight)}</td>
                  <td className="px-4 py-4">{formatCurrency(holding.marketValue)}</td>
                  <td className="hidden max-w-xl px-4 py-4 text-muted md:table-cell">{holding.topSignal}</td>
                  <td className="px-4 py-4 text-right">
                    <button type="button" onClick={() => remove(holding.symbol)} className="rounded p-2 text-muted transition hover:bg-canvas hover:text-brick" aria-label={`移除 ${holding.symbol}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
