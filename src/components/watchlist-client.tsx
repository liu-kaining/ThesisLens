"use client";

import { AlertTriangle, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Direction, SearchResult } from "@/lib/types";

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WatchlistItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedQuery = useMemo(() => symbol.trim(), [symbol]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [items]
  );

  useEffect(() => {
    if (!normalizedQuery) {
      setResults([]);
      setSearchOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results ?? []);
        setSearchOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const exact = results.find((item) => item.symbol.toUpperCase() === symbol.trim().toUpperCase());
    const normalized = (exact?.symbol ?? results[0]?.symbol ?? symbol).trim().toUpperCase();
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
      setResults([]);
      setSearchOpen(false);
      setNotes("");
    });
  }

  function removeItem(itemSymbol: string) {
    startTransition(async () => {
      await fetch(`/api/watchlist/items/${encodeURIComponent(itemSymbol)}`, {
        method: "DELETE"
      });
      setItems((current) => current.filter((item) => item.symbol !== itemSymbol));
      setDeleteTarget(null);
    });
  }

  function chooseResult(result: SearchResult) {
    setSymbol(result.symbol);
    setSearchOpen(false);
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
          <div className="relative mt-2">
            <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-white px-3 focus-within:border-steel">
              <Search className="h-4 w-4 text-muted" aria-hidden="true" />
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                onFocus={() => results.length > 0 && setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                placeholder="例如 AMZN / Tesla"
                className="min-w-0 flex-1 bg-transparent text-sm normal-case tracking-normal text-ink outline-none placeholder:text-muted"
                aria-label="搜索股票代码或公司"
              />
              {symbol ? (
                <button
                  type="button"
                  onClick={() => {
                    setSymbol("");
                    setResults([]);
                    setSearchOpen(false);
                  }}
                  className="rounded p-1 text-muted transition hover:bg-canvas hover:text-ink"
                  aria-label="清空股票搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {searchOpen ? (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-line bg-white shadow-soft">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm font-medium normal-case tracking-normal text-muted">搜索中...</div>
                ) : results.length > 0 ? (
                  results.slice(0, 8).map((result) => (
                    <button
                      key={result.symbol}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseResult(result)}
                      className="flex w-full items-center justify-between gap-4 border-b border-line px-4 py-3 text-left normal-case tracking-normal transition last:border-b-0 hover:bg-canvas"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ink">{result.symbol}</span>
                        <span className="block text-xs text-muted">{result.name}</span>
                      </span>
                      <span className="text-right text-xs font-medium text-muted">{result.exchange}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm font-medium normal-case tracking-normal text-muted">
                    没有找到匹配的美股标的。
                  </div>
                )}
              </div>
            ) : null}
          </div>
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
                      onClick={() => setDeleteTarget(item)}
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

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="watchlist-delete-title"
        >
          <div className="w-full max-w-md rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-brick/30 bg-brick/5 text-brick">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 id="watchlist-delete-title" className="text-base font-semibold text-ink">
                  确认移除观察标的？
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  将从观察列表中移除{" "}
                  <span className="font-semibold text-ink">{deleteTarget.symbol}</span>
                  {deleteTarget.name ? ` · ${deleteTarget.name}` : ""}。这个操作只影响你的研究池，不会删除任何 FMP 数据。
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-line bg-canvas p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">待移除</p>
              <p className="mt-1 text-sm font-semibold text-steel">{deleteTarget.symbol}</p>
              <p className="mt-1 truncate text-xs text-muted">{deleteTarget.name ?? deleteTarget.notes ?? "暂无备注"}</p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="h-10 rounded-md border border-line px-4 text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => removeItem(deleteTarget.symbol)}
                disabled={isPending}
                className="h-10 rounded-md bg-brick px-4 text-sm font-semibold text-white transition hover:bg-[#7f332b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "移除中..." : "确认移除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
