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
          <p className="text-sm font-semibold text-steel">Portfolio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Understand exposure through thesis quality, valuation, and event risk.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Portfolio view translates holdings into weighted research exposure. It is not a
            brokerage connection; it is a manual lens for concentration, quality, valuation,
            catalysts, and risk.
          </p>
        </section>
        <PortfolioClient initialPortfolio={portfolio} />
      </div>
    </main>
  );
}

