"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SearchResult } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type SearchBoxProps = {
  compact?: boolean;
};

export function SearchBox({ compact = false }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!normalized) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results ?? []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalized]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = results[0]?.symbol ?? normalized.toUpperCase();
    if (symbol) router.push(`/stocks/${symbol}`);
  }

  function goTo(symbol: string) {
    setOpen(false);
    router.push(`/stocks/${symbol}`);
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={submit}
        className={`flex items-center gap-2 rounded-md border border-line bg-white px-3 shadow-sm focus-within:border-steel ${
          compact ? "h-11" : "h-14"
        }`}
      >
        <Search className="h-5 w-5 text-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search ticker or company"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
          aria-label="Search ticker or company"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="rounded p-1 text-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-steel"
        >
          Open
        </button>
      </form>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-line bg-white shadow-soft">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.symbol}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goTo(result.symbol)}
                className="flex w-full items-center justify-between gap-4 border-b border-line px-4 py-3 text-left transition last:border-b-0 hover:bg-canvas"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">{result.symbol}</span>
                  <span className="block text-xs text-muted">{result.name}</span>
                </span>
                <span className="hidden text-right text-xs text-muted sm:block">
                  <span className="block">{result.exchange}</span>
                  <span className="block">{formatCurrency(result.marketCap)}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted">No matching U.S. equities found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

