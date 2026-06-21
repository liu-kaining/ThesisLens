import { AppNav } from "@/components/app-nav";
import { AlertsClient } from "@/components/alerts-client";
import { getEvaluatedAlerts } from "@/lib/server/alerts";

export default async function AlertsPage() {
  const alerts = await getEvaluatedAlerts();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">Alerts</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Turn signals into monitored conditions.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Alerts evaluate ThesisLens scores and price context. They are designed to
            support future background jobs and notifications while remaining useful in
            the current web app.
          </p>
        </section>
        <AlertsClient initialAlerts={alerts} />
      </div>
    </main>
  );
}

