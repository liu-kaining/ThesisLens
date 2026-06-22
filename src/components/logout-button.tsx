"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store"
      });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {loading ? "退出中" : "退出"}
    </button>
  );
}
