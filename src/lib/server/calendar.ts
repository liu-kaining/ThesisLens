import { getCompanyResearch } from "@/lib/server/research";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA"];

export async function getCalendarEvents(symbols = DEFAULT_SYMBOLS) {
  const models = await Promise.all(symbols.map((symbol) => getCompanyResearch(symbol)));

  return models
    .flatMap((model) => [
      ...model.snapshot.upcomingEvents.map((event) => ({
        id: event.id,
        symbol: model.snapshot.profile.symbol,
        company: model.snapshot.profile.name,
        date: event.date,
        type: event.type,
        title: event.title,
        detail: event.description ?? "Review event details.",
        severity: event.severity
      })),
      ...model.snapshot.filings.slice(0, 3).map((filing) => ({
        id: filing.id,
        symbol: model.snapshot.profile.symbol,
        company: model.snapshot.profile.name,
        date: filing.filingDate,
        type: "filing",
        title: `${filing.formType} filed`,
        detail: filing.title,
        severity: filing.formType === "8-K" ? "medium" : "low"
      }))
    ])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

