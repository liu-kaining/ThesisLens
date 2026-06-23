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
          <p className="text-sm font-semibold text-steel">提醒</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            把研究信号变成可监控条件。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            提醒规则由你手动创建，可作用于观察列表中的股票，也可作用于任意美股代码。
            当前版本在网页中评估 ThesisLens 分数、价格变化和事件风险。
          </p>
        </section>
        <AlertsClient initialAlerts={alerts} />
      </div>
    </main>
  );
}
