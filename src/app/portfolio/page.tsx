import { AppNav } from "@/components/app-nav";
import { PortfolioClient } from "@/components/portfolio-client";
import { getPortfolioModel } from "@/lib/server/portfolio";

export default async function PortfolioPage() {
  const portfolio = await getPortfolioModel();

  return (
    <main className="min-h-screen bg-canvas">
      <AppNav showSearch />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-steel">组合</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            用 thesis 质量、估值和事件风险理解持仓暴露。
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            组合页把手动持仓转成加权研究暴露。它不是券商连接，
            而是用于观察集中度、质量、估值、催化剂和风险的研究视角。
          </p>
        </section>
        <PortfolioClient initialPortfolio={portfolio} />
      </div>
    </main>
  );
}
