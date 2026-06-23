import { AppNav } from "@/components/app-nav";
import { WatchlistClient } from "@/components/watchlist-client";
import { getEnrichedWatchlist } from "@/lib/server/watchlist";

export default async function WatchlistPage() {
  const watchlist = await getEnrichedWatchlist();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">观察列表</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            你的研究池今天发生了什么变化？
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            观察列表是 ThesisLens 的默认研究宇宙。总览、选股器、市场和日历都会基于这里的标的生成，
            组合、Thesis 和提醒则作为独立工作流手动维护。
          </p>
        </section>
        <WatchlistClient initialItems={watchlist.items} />
      </div>
    </main>
  );
}
