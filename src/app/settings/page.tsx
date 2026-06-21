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
          <p className="text-sm font-semibold text-steel">设置</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            数据模式、存储状态和上线准备度。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            这个页面把不确定性摊开：当前是否使用实时 FMP、Postgres、Redis，
            以及是否落到了示例/内存兜底。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard label="FMP 模式" value={fmpMode} detail={hasFmpKey ? "已配置 API key" : "未配置 API key"} />
          <StatusCard
            label="数据库"
            value={database.connected ? "Postgres" : "内存兜底"}
            detail={database.enabled ? "已配置 DATABASE_URL" : "未配置 DATABASE_URL"}
          />
          <StatusCard
            label="缓存"
            value={cache.connected ? "Redis" : "内存兜底"}
            detail={cache.enabled ? "已配置 REDIS_URL" : "未配置 REDIS_URL"}
          />
          <StatusCard label="合规边界" value="仅研究" detail="不提供买入/卖出/持有建议" />
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">上线检查清单</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "用真实 key 验证 FMP Premium 各端点的可访问性。",
              "公开上线前确认 FMP 数据展示和再分发权限。",
              "每个研究结论都必须能回到证据 ID。",
              "生产环境使用 Docker 或托管服务里的 Postgres 和 Redis。",
              "规则研究备忘录只能作为研究摘要，不作为投资建议。",
              "存储真实用户观察列表前，需要加入登录和权限控制。"
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
