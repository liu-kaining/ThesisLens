import { AppNav } from "@/components/app-nav";
import { ThesesClient } from "@/components/theses-client";
import { getSavedTheses } from "@/lib/server/db";

export default async function ThesesPage() {
  const theses = await getSavedTheses();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">Thesis Tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Track what must remain true.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            A saved thesis turns research into a living checklist. The next step is to
            connect each thesis to signals, alerts, filings, and watchlist changes.
          </p>
        </section>
        <ThesesClient initialTheses={theses} />
      </div>
    </main>
  );
}

