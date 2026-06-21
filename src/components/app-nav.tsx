import Link from "next/link";
import { SearchBox } from "@/components/search-box";

const navItems = [
  { href: "/", label: "总览" },
  { href: "/watchlist", label: "观察列表" },
  { href: "/screens", label: "选股器" },
  { href: "/portfolio", label: "组合" },
  { href: "/theses", label: "Thesis" },
  { href: "/alerts", label: "提醒" },
  { href: "/market", label: "市场" },
  { href: "/calendar", label: "日历" },
  { href: "/settings", label: "设置" }
];

export function AppNav({ showSearch = false }: { showSearch?: boolean }) {
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
          {navItems.map((item) => (
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
      </div>
    </header>
  );
}
