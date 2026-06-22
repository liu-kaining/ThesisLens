"use client";

import { Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { AccessCodePublicRecord } from "@/lib/server/db";

type AccessCodeManagerProps = {
  initialCodes: AccessCodePublicRecord[];
};

const ttlOptions = [
  { label: "1 小时", value: 1 },
  { label: "6 小时", value: 6 },
  { label: "24 小时", value: 24 },
  { label: "72 小时", value: 72 },
  { label: "7 天", value: 168 }
];

export function AccessCodeManager({ initialCodes }: AccessCodeManagerProps) {
  const [codes, setCodes] = useState(initialCodes);
  const [ttlHours, setTtlHours] = useState(24);
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ttlHours })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        code?: string;
        record?: AccessCodePublicRecord;
        error?: string;
      };

      if (!response.ok || !payload.code || !payload.record) {
        setError(payload.error ?? "访问口令生成失败。");
        return;
      }

      setNewCode(payload.code);
      setCodes((current) => [payload.record as AccessCodePublicRecord, ...current.map((item) => ({ ...item, active: false }))].slice(0, 10));
    } catch {
      setError("访问口令生成请求失败。");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode);
    setCopied(true);
  }

  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">动态访问口令</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            生成新口令会让仍在有效期内的旧口令失效。明文口令只会显示这一次。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={ttlHours}
            onChange={(event) => setTtlHours(Number(event.target.value))}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none focus:border-steel"
          >
            {ttlOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-steel disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {loading ? "生成中" : "重建口令"}
          </button>
        </div>
      </div>

      {newCode ? (
        <div className="mt-4 rounded-md border border-moss/30 bg-moss/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">新访问口令</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all rounded-md border border-line bg-white px-3 py-2 text-lg font-semibold tracking-normal text-ink">
              {newCode}
            </code>
            <button
              type="button"
              onClick={copy}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-ink transition hover:bg-white"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-brick/30 bg-brick/5 px-3 py-2 text-sm leading-6 text-brick">
          {error}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-md border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">创建时间</th>
              <th className="px-3 py-2">过期时间</th>
              <th className="px-3 py-2">创建者</th>
            </tr>
          </thead>
          <tbody>
            {codes.length ? (
              codes.map((code) => (
                <tr key={code.id} className="border-t border-line">
                  <td className="px-3 py-3 font-medium text-ink">{code.active ? "有效" : "失效"}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(code.createdAt)}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(code.expiresAt)}</td>
                  <td className="px-3 py-3 text-muted">{code.createdBy}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={4}>
                  还没有生成过访问口令。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
