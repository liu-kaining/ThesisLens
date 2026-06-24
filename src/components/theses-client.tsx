"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { thesisStatusLabel } from "@/lib/labels";

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
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError("");
      try {
        const response = await fetch("/api/theses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, title, thesisText, status })
        });
        if (!response.ok) throw new Error("保存失败");
        const payload = (await response.json()) as { theses: Thesis[] };
        setTheses(payload.theses ?? []);
        setSymbol("");
        setTitle("");
        setThesisText("");
        setStatus("active");
      } catch {
        setError("Thesis 保存失败，请稍后重试。");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      setError("");
      try {
        const response = await fetch(`/api/theses/${encodeURIComponent(id)}`, {
          method: "DELETE"
        });
        if (!response.ok) throw new Error("删除失败");
        const payload = (await response.json()) as { theses: Thesis[] };
        setTheses(payload.theses ?? []);
      } catch {
        setError("Thesis 删除失败，数据没有被修改。");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      {error ? (
        <div className="rounded-md border border-brick/30 bg-brick/5 p-3 text-sm text-brick lg:col-span-2">
          {error}
        </div>
      ) : null}
      <form onSubmit={submit} className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">保存 Thesis</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          记录你希望 ThesisLens 持续跟踪的研究判断。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            股票代码
            <input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="MSFT"
              className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            状态
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Thesis["status"])}
              className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
            >
              <option value="active">进行中</option>
              <option value="watching">观察中</option>
              <option value="closed">已关闭</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          标题
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="云业务经营杠杆"
            className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          Thesis 内容
          <textarea
            value={thesisText}
            onChange={(event) => setThesisText(event.target.value)}
            placeholder="这个投资 thesis 要成立，哪些条件必须继续为真？"
            rows={6}
            className="mt-2 w-full resize-none rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-steel"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-60"
        >
          {isPending ? "保存中..." : "保存 Thesis"}
        </button>
      </form>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Thesis 跟踪</h2>
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
                  <span className="rounded border border-line px-2 py-1 text-xs text-muted">
                    {thesisStatusLabel(thesis.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(thesis.id)}
                    className="rounded p-2 text-muted transition hover:bg-canvas hover:text-brick"
                    aria-label={`删除 thesis ${thesis.title}`}
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
