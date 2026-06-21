"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";

type Thesis = {
  id: string;
  symbol: string;
  title: string;
  thesisText: string;
  status: "active" | "watching" | "closed";
  updatedAt: string;
};

export function ThesesClient({ initialTheses }: { initialTheses: Thesis[] }) {
  const [theses, setTheses] = useState(initialTheses);
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [thesisText, setThesisText] = useState("");
  const [status, setStatus] = useState<Thesis["status"]>("active");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/theses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, title, thesisText, status })
      });
      const payload = (await response.json()) as { theses: Thesis[] };
      setTheses(payload.theses ?? []);
      setSymbol("");
      setTitle("");
      setThesisText("");
      setStatus("active");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/theses/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as { theses: Thesis[] };
      setTheses(payload.theses ?? []);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={submit} className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Save Thesis</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Capture the research claim you want ThesisLens to monitor over time.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Symbol
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="MSFT"
              className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Thesis["status"])}
              className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
            >
              <option value="active">Active</option>
              <option value="watching">Watching</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="AI cloud operating leverage"
            className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          Thesis Text
          <textarea
            value={thesisText}
            onChange={(event) => setThesisText(event.target.value)}
            placeholder="What would need to remain true for this investment thesis to work?"
            rows={6}
            className="mt-2 w-full resize-none rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save thesis"}
        </button>
      </form>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Thesis Tracker</h2>
        <div className="mt-4 grid gap-3">
          {theses.map((thesis) => (
            <article key={thesis.id} className="rounded-md border border-line p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/stocks/${thesis.symbol}`} className="text-sm font-semibold text-steel hover:text-ink">
                    {thesis.symbol}
                  </Link>
                  <h3 className="mt-1 text-base font-semibold text-ink">{thesis.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-line px-2 py-1 text-xs text-muted">{thesis.status}</span>
                  <button
                    type="button"
                    onClick={() => remove(thesis.id)}
                    className="rounded p-2 text-muted transition hover:bg-canvas hover:text-brick"
                    aria-label={`Delete thesis ${thesis.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{thesis.thesisText}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

