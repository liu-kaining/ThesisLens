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
            观察列表是 ThesisLens 的日常工作台。它按可解释分数排序，
            并突出每家公司当前最重要的研究信号。
          </p>
        </section>
        <WatchlistClient initialItems={watchlist.items} />
      </div>
    </main>
  );
}
