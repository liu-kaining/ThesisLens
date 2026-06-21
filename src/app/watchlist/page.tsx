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
          <p className="text-sm font-semibold text-steel">Watchlist</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            What changed across your research universe?
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            The watchlist is the daily operating surface for ThesisLens. It ranks monitored
            companies by explainable score and highlights the most important current signal.
          </p>
        </section>
        <WatchlistClient initialItems={watchlist.items} />
      </div>
    </main>
  );
}
