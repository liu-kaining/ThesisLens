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
            Thesis 是你手动保存的研究假设，可以来自观察列表，也可以来自任意美股代码。
            保存后它会变成一张检查清单，用来对照信号、提醒、SEC 文件和观察列表变化。
          </p>
        </section>
        <ThesesClient initialTheses={theses} />
      </div>
    </main>
  );
}
