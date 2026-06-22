"use client";

import { Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type LoginFormProps = {
  nextPath: string;
  authConfigured: boolean;
};

export function LoginForm({ nextPath, authConfigured }: LoginFormProps) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passphrase, next: nextPath })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; next?: string };

      if (!response.ok) {
        setError(payload.error ?? "登录失败，请检查账号配置。");
        return;
      }

      router.replace(payload.next ?? "/");
      router.refresh();
    } catch {
      setError("登录请求失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink">口令登录</h1>
          <p className="mt-1 text-sm text-muted">输入管理员口令或有效访问口令。</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">口令</span>
          <input
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            type="password"
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-steel"
            disabled={!authConfigured}
          />
        </label>
      </div>

      {!authConfigured ? (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
          管理员口令未配置。请先设置 ADMIN_PASSPHRASE 和 AUTH_SECRET。
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-md border border-brick/30 bg-brick/5 px-3 py-2 text-sm leading-6 text-brick">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!authConfigured || loading}
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-steel disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {loading ? "验证中..." : "进入研究台"}
      </button>
    </form>
  );
}
