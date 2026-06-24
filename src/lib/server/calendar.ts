import { getCompanyResearch } from "@/lib/server/research";
import {
  getResearchUniverse,
  researchUniverseFromSymbols,
  type ResearchUniverse
} from "@/lib/server/universe";
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

export async function getCalendarEvents(
  symbols?: string[],
  universeId?: string | null
): Promise<CalendarModel> {
  const universe = symbols
    ? researchUniverseFromSymbols(symbols)
    : await getResearchUniverse({ id: universeId });
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
