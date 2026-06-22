import { redirect } from "next/navigation";
import { AccessCodeManager } from "@/components/access-code-manager";
import { AppNav } from "@/components/app-nav";
import { getAuthConfigStatus } from "@/lib/auth/session";
import { getCacheStats } from "@/lib/server/cache";
import { getAccessCodes, getDatabaseHealth } from "@/lib/server/db";
import { getFmpEndpointHealth } from "@/lib/server/fmp";
import { getCurrentSession } from "@/lib/server/auth";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (session?.role !== "admin") redirect("/");

  const [database, cache, accessCodes] = await Promise.all([getDatabaseHealth(), getCacheStats(), getAccessCodes()]);
  const auth = getAuthConfigStatus();
  const fmpHealth = getFmpEndpointHealth();
  const failedEndpoints = fmpHealth.filter((endpoint) => !endpoint.ok);

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">管理员视角</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            访问控制、运行状态和数据边界。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            这里用于确认 ThesisLens 是否处在私有访问、真实数据和可维护的运行状态。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard label="当前身份" value={session.subject} detail="角色：admin" tone="neutral" />
          <StatusCard
            label="全站鉴权"
            value={auth.authConfigured ? "已启用" : "未配置"}
            detail="管理员口令和动态访问口令"
            tone={auth.authConfigured ? "good" : "warn"}
          />
          <StatusCard
            label="内部 API"
            value={auth.internalTokenConfigured ? "Token 已配置" : "Token 缺失"}
            detail="worker 使用 x-internal-token"
            tone={auth.internalTokenConfigured ? "good" : "warn"}
          />
          <StatusCard
            label="FMP 端点"
            value={fmpHealth.length ? `${fmpHealth.length - failedEndpoints.length}/${fmpHealth.length} 可用` : "待采样"}
            detail={failedEndpoints.length ? `${failedEndpoints.length} 个端点失败` : "访问后自动记录"}
            tone={failedEndpoints.length ? "warn" : "neutral"}
          />
        </section>

        <AccessCodeManager initialCodes={accessCodes} />

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">运行状态</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SmallStatus label="数据库" value={database.connected ? "Postgres 已连接" : "内存兜底"} />
              <SmallStatus label="缓存" value={cache.connected ? "Redis 已连接" : "内存兜底"} />
              <SmallStatus label="认证 Cookie" value="HttpOnly 签名会话" />
              <SmallStatus label="公开接口" value="/api/health 仅用于健康检查" />
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">权限边界</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>普通页面、股票页、研究 API、观察列表、组合、提醒和设置页都需要登录。</p>
              <p>访问口令只提供 viewer 权限，不能进入管理员页或重建口令。</p>
              <p>后台 worker 不使用管理员口令，只能通过 INTERNAL_API_TOKEN 调用内部 API。</p>
              <p>当前版本仍是口令模式；多人协作上线前需要引入用户表、角色、审计日志和数据归属。</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">上线前必须确认</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              "ADMIN_PASSPHRASE、AUTH_SECRET、INTERNAL_API_TOKEN 必须换成生产级随机值。",
              "生产环境建议启用 HTTPS，并设置 AUTH_SECURE_COOKIES=true。",
              "如果要开放给多人使用，需要把 demo-user 替换成真实用户体系。",
              "FMP 数据再分发、展示范围和缓存策略需要按订阅条款复核。"
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

function StatusCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass = tone === "good" ? "text-moss" : tone === "warn" ? "text-amber" : "text-ink";

  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted">{detail}</p>
    </div>
  );
}

function SmallStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
