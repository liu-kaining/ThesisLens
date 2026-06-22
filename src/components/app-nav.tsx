import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { SearchBox } from "@/components/search-box";
import { getCurrentSession } from "@/lib/server/auth";

const navItems = [
  { href: "/", label: "总览" },
  { href: "/watchlist", label: "观察列表" },
  { href: "/screens", label: "选股器" },
  { href: "/portfolio", label: "组合" },
  { href: "/theses", label: "Thesis" },
  { href: "/alerts", label: "提醒" },
  { href: "/market", label: "市场" },
  { href: "/calendar", label: "日历" }
];

const adminNavItems = [
  { href: "/settings", label: "设置" }
];

export async function AppNav({ showSearch = false }: { showSearch?: boolean }) {
  const session = await getCurrentSession();
  const isAdmin = session?.role === "admin";

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            TL
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">ThesisLens</span>
            <span className="hidden text-xs text-muted sm:block">证据驱动的美股研究台</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted">
          {[...navItems, ...(isAdmin ? adminNavItems : [])].map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        {showSearch ? (
          <div className="w-full lg:max-w-md">
            <SearchBox compact />
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              管理员
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
