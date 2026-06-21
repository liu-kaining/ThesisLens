"use client";

import { Trash2 } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { alertDirectionLabel, alertTypeLabel } from "@/lib/labels";

type Alert = {
  id: string;
  symbol: string;
  alertType: string;
  threshold?: number | null;
  direction: string;
  note?: string | null;
  enabled: boolean;
  currentValue: number | null;
  triggered: boolean;
  explanation: string;
};

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] = useState("quality_score");
  const [threshold, setThreshold] = useState("");
  const [direction, setDirection] = useState("above");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          alertType,
          threshold: threshold ? Number(threshold) : null,
          direction,
          note
        })
      });
      const payload = (await response.json()) as { alerts: Alert[] };
      setAlerts(payload.alerts ?? []);
      setSymbol("");
      setThreshold("");
      setNote("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/alerts/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as { alerts: Alert[] };
      setAlerts(payload.alerts ?? []);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={submit} className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">创建提醒规则</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            股票代码
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            指标
            <select value={alertType} onChange={(event) => setAlertType(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel">
              <option value="quality_score">基本面质量分</option>
              <option value="valuation_score">估值分</option>
              <option value="expectations_score">预期分</option>
              <option value="event_risk">事件风险</option>
              <option value="price_move">价格波动</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            方向
            <select value={direction} onChange={(event) => setDirection(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel">
              <option value="above">高于</option>
              <option value="below">低于</option>
              <option value="any">绝对波动</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            阈值
            <input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" step="0.1" className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel" />
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          备注
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-steel" />
        </label>
        <button type="submit" disabled={isPending} className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-60">
          {isPending ? "保存中..." : "创建提醒"}
        </button>
      </form>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">已评估提醒</h2>
        <div className="mt-4 grid gap-3">
          {alerts.map((alert) => (
            <article key={alert.id} className="rounded-md border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-steel">{alert.symbol} · {alertTypeLabel(alert.alertType)}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{alert.explanation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={alert.triggered ? "rounded border border-moss bg-[#f2f6ec] px-2 py-1 text-xs text-moss" : "rounded border border-line px-2 py-1 text-xs text-muted"}>
                    {alert.triggered ? "已触发" : "未触发"}
                  </span>
                  <button type="button" onClick={() => remove(alert.id)} className="rounded p-2 text-muted transition hover:bg-canvas hover:text-brick" aria-label={`删除提醒 ${alert.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                当前值：{alert.currentValue?.toFixed(1) ?? "N/A"} · 规则：{alertDirectionLabel(alert.direction)} {alert.threshold ?? "N/A"}
              </p>
              {alert.note ? <p className="mt-2 text-sm text-muted">{alert.note}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
