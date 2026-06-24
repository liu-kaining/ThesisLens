import Link from "next/link";
import type { ResearchUniverse } from "@/lib/server/universe";
import { RESEARCH_UNIVERSE_OPTIONS } from "@/lib/universes";

export function UniverseSelector({
  basePath,
  universe
}: {
  basePath: string;
  universe: ResearchUniverse;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-ink">研究范围</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            当前：{universe.name}。已分析 {universe.count} 家
            {universe.totalCount !== universe.count ? `，池内共 ${universe.totalCount} 家` : ""}。
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="切换研究范围">
          {RESEARCH_UNIVERSE_OPTIONS.map((option) => {
            const active = option.id === universe.id;
            const href =
              option.id === "watchlist"
                ? basePath
                : `${basePath}?universe=${encodeURIComponent(option.id)}`;

            return (
              <Link
                key={option.id}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-muted hover:border-steel hover:text-ink"
                }`}
              >
                {option.shortName}
              </Link>
            );
          })}
        </div>
      </div>
      {universe.isTruncated ? (
        <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">
          为控制 FMP 请求量和页面响应时间，本页分析当前研究池的首批 {universe.count} 家；
          成分总数和成员关系仍完整保存在数据库中，后台会持续增量预热研究快照。
        </p>
      ) : null}
    </section>
  );
}
