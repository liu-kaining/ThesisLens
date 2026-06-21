"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Direction } from "@/lib/types";

type WatchlistItem = {
  id: string;
  symbol: string;
  notes?: string | null;
  name?: string;
  price?: number;
  changePercent?: number;
  score?: number;
  topSignal?: string;
  changeBadges?: Array<{
    category: string;
    label: string;
    direction: Direction;
    detail: string;
  }>;
};

type WatchlistClientProps = {
  initialItems: WatchlistItem[];
};

export function WatchlistClient({ initialItems }: WatchlistClientProps) {
  const [items, setItems] = useState(initialItems);
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [items]
  );

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    startTransition(async () => {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: normalized, notes })
      });
      const response = await fetch("/api/watchlist");
      const payload = (await response.json()) as { items: WatchlistItem[] };
      setItems(payload.items ?? []);
      setSymbol("");
      setNotes("");
    });
  }

  function removeItem(itemSymbol: string) {
    startTransition(async () => {
      await fetch(`/api/watchlist/items/${encodeURIComponent(itemSymbol)}`, {
        method: "DELETE"
      });
      setItems((current) => current.filter((item) => item.symbol !== itemSymbol));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={addItem} className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">添加研究标的</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          添加股票代码，用来跟踪质量、估值、预期、事件和行为信号。
        </p>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted">
          股票代码
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="例如 AMZN"
            className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          备注
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="你想跟踪什么 thesis？"
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-60"
        >
          {isPending ? "更新中..." : "加入观察列表"}
        </button>
      </form>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">核心研究观察列表</h2>
            <p className="mt-1 text-sm text-muted">正在跟踪 {items.length} 家公司</p>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">代码</th>
                <th className="hidden px-4 py-3 sm:table-cell">信号与变化</th>
                <th className="px-4 py-3">价格</th>
                <th className="px-4 py-3">涨跌</th>
                <th className="px-4 py-3">分数</th>
                <th className="px-4 py-3" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.symbol} className="border-t border-line">
                  <td className="px-4 py-4">
                    <Link href={`/stocks/${item.symbol}`} className="font-semibold text-steel hover:text-ink">
                      {item.symbol}
                    </Link>
                    <p className="max-w-48 truncate text-xs text-muted">{item.name ?? item.notes}</p>
                  </td>
                  <td className="hidden max-w-xl px-4 py-4 text-muted sm:table-cell">
                    <p>{item.topSignal ?? item.notes ?? "暂无信号"}</p>
                    {item.changeBadges?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.changeBadges.map((badge) => (
                          <span
                            key={`${item.symbol}-${badge.category}`}
                            title={badge.detail}
                            className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                              badge.direction === "positive"
                                ? "border-moss bg-[#f2f6ec] text-moss"
                                : badge.direction === "negative"
                                  ? "border-brick bg-[#fff1ef] text-brick"
                                  : badge.direction === "mixed"
                                    ? "border-amber bg-[#fff7e8] text-amber"
                                    : "border-line bg-canvas text-muted"
                            }`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 font-medium">{formatCurrency(item.price, false)}</td>
                  <td className={`px-4 py-4 font-semibold ${(item.changePercent ?? 0) >= 0 ? "text-moss" : "text-brick"}`}>
                    {formatPercent(item.changePercent)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-ink px-2 py-1 text-xs font-semibold text-white">
                      {item.score ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.symbol)}
                      className="rounded p-2 text-muted transition hover:bg-canvas hover:text-brick"
                      aria-label={`移除 ${item.symbol}`}
                    >
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
