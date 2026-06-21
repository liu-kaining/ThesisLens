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
          <p className="text-sm font-semibold text-steel">Thesis 跟踪</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            跟踪必须继续成立的条件。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            保存后的 thesis 会变成一张动态检查清单。下一步可以把每条 thesis
            连接到信号、提醒、SEC 文件和观察列表变化。
          </p>
        </section>
        <ThesesClient initialTheses={theses} />
      </div>
    </main>
  );
}
