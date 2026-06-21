import { AppNav } from "@/components/app-nav";
import { getCacheStats } from "@/lib/server/cache";
import { getDatabaseHealth } from "@/lib/server/db";

export default async function SettingsPage() {
  const [database, cache] = await Promise.all([getDatabaseHealth(), getCacheStats()]);
  const hasFmpKey = Boolean(process.env.FMP_API_KEY);
  const fmpMode = process.env.FMP_USE_MOCKS !== "false" || !hasFmpKey ? "示例/兜底" : "实时 FMP";

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            数据模式、存储状态和上线准备度。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            这个页面把不确定性摊开：当前是否使用实时 FMP、Postgres、Redis，
            以及是否落到了示例/内存兜底。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard label="FMP mode" value={fmpMode} detail={hasFmpKey ? "API key present" : "No API key configured"} />
          <StatusCard
            label="Database"
            value={database.connected ? "Postgres" : "memory fallback"}
            detail={database.enabled ? "DATABASE_URL configured" : "DATABASE_URL not configured"}
          />
          <StatusCard
            label="Cache"
            value={cache.connected ? "Redis" : "memory fallback"}
            detail={cache.enabled ? "REDIS_URL configured" : "REDIS_URL not configured"}
          />
          <StatusCard label="Compliance" value="research only" detail="No buy/sell/hold advice" />
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">Launch Checklist</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "Validate FMP Premium endpoint access with the real key.",
              "Confirm FMP data display and redistribution rights before public launch.",
              "Keep every AI claim tied to evidence IDs.",
              "Use Postgres and Redis in Docker or managed production services.",
              "Review generated memos as research summaries, not investment advice.",
              "Add authentication before storing real user watchlists."
            ].map((item) => (
              <div key={item} className="rounded-md border border-line bg-canvas p-3 text-sm leading-6 text-muted">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted">{detail}</p>
    </div>
  );
}
