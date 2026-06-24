import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { dateShort, formatPercent } from "@/lib/format";
import { getSystemUniversePage } from "@/lib/server/system-universes";
import {
  getSystemUniverseDefinition,
  type SystemUniverseId
} from "@/lib/universes";

const PAGE_SIZE = 50;

type UniversesPageProps = {
  searchParams: Promise<{
    universe?: string;
    page?: string;
  }>;
};

export default async function UniversesPage({ searchParams }: UniversesPageProps) {
  const params = await searchParams;
  const selectedId =
    getSystemUniverseDefinition(params.universe ?? "")?.id ?? "sp500";
  const requestedPage = parsePositiveInteger(params.page);
  const model = await getSystemUniversePage(selectedId, requestedPage, PAGE_SIZE);
  const selected = model.selectedUniverse;

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">系统研究池</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            美股核心研究范围。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            系统研究池用于发现机会、横向筛选和后台预热，不会自动进入你的个人观察列表。
            下方成分表来自本地数据库，可完整分页浏览。
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {model.universes.map((universe) => {
            const active = selected?.id === universe.id;

            return (
              <Link
                key={universe.id}
                href={universeHref(universe.id)}
                aria-current={active ? "page" : undefined}
                className={`rounded-md border p-4 shadow-sm transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white hover:border-steel"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold">{universe.name}</h2>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      active ? "bg-white/10 text-white" : "bg-canvas text-muted"
                    }`}
                  >
                    {universe.activeCount}
                  </span>
                </div>
                <p
                  className={`mt-2 text-xs leading-5 ${
                    active ? "text-white/75" : "text-muted"
                  }`}
                >
                  {universe.refreshedAt
                    ? `刷新于 ${new Date(universe.refreshedAt).toLocaleDateString("zh-CN")}`
                    : "尚未同步"}
                </p>
              </Link>
            );
          })}
        </section>

        {selected ? (
          <section className="rounded-md border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-ink">{selected.name}</h2>
                  <span className="rounded border border-line bg-canvas px-2 py-1 text-xs font-semibold text-muted">
                    {selected.sourceSymbol ?? selected.sourceType}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                  {selected.description}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  当前有效成分 {selected.activeCount} 家，历史记录 {selected.memberCount} 家。
                  {selected.refreshedAt
                    ? ` 最近同步 ${new Date(selected.refreshedAt).toLocaleString("zh-CN")}。`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionLink href={`/screens?universe=${selected.id}`}>用于选股</ActionLink>
                <ActionLink href={`/market?universe=${selected.id}`}>查看横截面</ActionLink>
                <ActionLink href={`/calendar?universe=${selected.id}`}>查看事件</ActionLink>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-canvas text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="w-16 px-4 py-3">序号</th>
                    <th className="px-4 py-3">代码</th>
                    <th className="px-4 py-3">公司</th>
                    <th className="px-4 py-3">板块</th>
                    <th className="px-4 py-3">行业</th>
                    <th className="px-4 py-3 text-right">权重</th>
                    <th className="px-4 py-3">来源</th>
                    <th className="px-4 py-3">最近确认</th>
                  </tr>
                </thead>
                <tbody>
                  {model.members.map((member, index) => (
                    <tr key={`${selected.id}-${member.symbol}`} className="border-t border-line">
                      <td className="px-4 py-3 text-muted">
                        {member.rank ?? model.pagination.from + index}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/stocks/${member.symbol}`}
                          className="font-semibold text-steel hover:text-ink"
                        >
                          {member.symbol}
                        </Link>
                      </td>
                      <td className="max-w-64 px-4 py-3 text-ink">
                        {member.name ?? "N/A"}
                      </td>
                      <td className="max-w-44 px-4 py-3 text-muted">
                        {member.sector ?? "N/A"}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-muted">
                        {member.industry ?? "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        {member.weight === null || member.weight === undefined
                          ? "N/A"
                          : formatPercent(member.weight)}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-muted">
                        {member.source ?? "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {dateShort(member.lastSeenAt)}
                      </td>
                    </tr>
                  ))}
                  {model.members.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                        尚未同步成分。后台 worker 完成同步后会在这里显示。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <Pagination
              universeId={selected.id}
              page={model.pagination.page}
              pageCount={model.pagination.pageCount}
              from={model.pagination.from}
              to={model.pagination.to}
              totalCount={model.pagination.totalCount}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Pagination({
  universeId,
  page,
  pageCount,
  from,
  to,
  totalCount
}: {
  universeId: SystemUniverseId;
  page: number;
  pageCount: number;
  from: number;
  to: number;
  totalCount: number;
}) {
  if (pageCount === 0) return null;

  const pages = paginationPages(page, pageCount);

  return (
    <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <p className="text-sm text-muted">
        显示 {from}-{to}，共 {totalCount} 条
      </p>
      <nav className="flex flex-wrap items-center gap-2" aria-label="研究池分页">
        <PageLink
          href={universeHref(universeId, page - 1)}
          disabled={page <= 1}
          label="上一页"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </PageLink>
        {pages.map((pageNumber, index) =>
          pageNumber === null ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted">
              ...
            </span>
          ) : (
            <PageLink
              key={pageNumber}
              href={universeHref(universeId, pageNumber)}
              active={pageNumber === page}
              label={`第 ${pageNumber} 页`}
            >
              {pageNumber}
            </PageLink>
          )
        )}
        <PageLink
          href={universeHref(universeId, page + 1)}
          disabled={page >= pageCount}
          label="下一页"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
  label
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-label={label}
        aria-disabled="true"
        className="flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm text-muted opacity-40"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-muted hover:border-steel hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function ActionLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:border-steel hover:text-ink"
    >
      {children}
    </Link>
  );
}

function universeHref(universeId: SystemUniverseId, page = 1) {
  const params = new URLSearchParams({ universe: universeId });
  if (page > 1) params.set("page", String(page));
  return `/universes?${params.toString()}`;
}

function parsePositiveInteger(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function paginationPages(page: number, pageCount: number): Array<number | null> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const visible = new Set([1, pageCount, page - 1, page, page + 1]);
  const ordered = Array.from(visible)
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  const result: Array<number | null> = [];

  for (const value of ordered) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && value - previous > 1) result.push(null);
    result.push(value);
  }

  return result;
}
