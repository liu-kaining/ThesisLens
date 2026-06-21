import Link from "next/link";
import { SearchBox } from "@/components/search-box";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/screens", label: "Screens" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/theses", label: "Theses" },
  { href: "/alerts", label: "Alerts" },
  { href: "/market", label: "Market" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Settings" }
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
            <span className="hidden text-xs text-muted sm:block">Evidence-backed equity research</span>
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
