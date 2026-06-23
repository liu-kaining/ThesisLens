import { getCompanyResearch } from "@/lib/server/research";
import { getResearchUniverse, type ResearchUniverse } from "@/lib/server/universe";
import type { Severity } from "@/lib/types";

export type CalendarEvent = {
  id: string;
  symbol: string;
  company: string;
  date: string;
  type: string;
  title: string;
  detail: string;
  severity: Severity;
};

export type CalendarModel = {
  generatedAt: string;
  universe: ResearchUniverse;
  events: CalendarEvent[];
};

function universeFromSymbols(symbols: string[]): ResearchUniverse {
  const seen = new Set<string>();
  const normalized = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => {
      if (!symbol || seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    });

  return {
    source: "watchlist",
    symbols: normalized,
    count: normalized.length,
    isEmpty: normalized.length === 0
  };
}

export async function getCalendarEvents(symbols?: string[]): Promise<CalendarModel> {
  const universe = symbols ? universeFromSymbols(symbols) : await getResearchUniverse();
  const models = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));

  const events: CalendarEvent[] = models
    .flatMap((model) => [
      ...model.snapshot.upcomingEvents.map((event) => ({
        id: event.id,
        symbol: model.snapshot.profile.symbol,
        company: model.snapshot.profile.name,
        date: event.date,
        type: event.type,
        title: event.title,
        detail: event.description ?? "需要复核事件细节。",
        severity: event.severity
      })),
      ...model.snapshot.filings.slice(0, 3).map((filing) => ({
        id: filing.id,
        symbol: model.snapshot.profile.symbol,
        company: model.snapshot.profile.name,
        date: filing.filingDate,
        type: "filing",
        title: `${filing.formType} 文件`,
        detail: filing.title,
        severity: (filing.formType === "8-K" ? "medium" : "low") as Severity
      }))
    ])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    generatedAt: new Date().toISOString(),
    universe,
    events
  };
}
