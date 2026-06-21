import { formatCurrency, formatPercent } from "@/lib/format";
import { getWatchlist, type WatchlistItemRecord } from "@/lib/server/db";
import { getCompanyResearch } from "@/lib/server/research";
import type { Direction, EnrichedResearch } from "@/lib/types";

export type WatchlistChangeBadge = {
  category:
    | "price"
    | "fundamentals"
    | "estimates"
    | "events"
    | "filings"
    | "behavior"
    | "technical";
  label: string;
  direction: Direction;
  detail: string;
};

export type EnrichedWatchlistItem = WatchlistItemRecord & {
  name: string;
  price: number;
  changePercent: number;
  score: number;
  topSignal: string;
  changeBadges: WatchlistChangeBadge[];
};

function scoreValue(research: EnrichedResearch, type: EnrichedResearch["scores"][number]["scoreType"]) {
  return research.scores.find((score) => score.scoreType === type)?.score ?? 50;
}

function badgeDirectionFromScore(score: number): Direction {
  if (score >= 68) return "positive";
  if (score < 45) return "negative";
  return "mixed";
}

function buildChangeBadges(research: EnrichedResearch): WatchlistChangeBadge[] {
  const { snapshot } = research;
  const latestFinancial = snapshot.financials[0];
  const previousFinancial = snapshot.financials[1];
  const estimate = snapshot.analystEstimates[0];
  const latestFiling = snapshot.filings[0];
  const latestTechnical = snapshot.technicals.at(-1);
  const revenueGrowth =
    latestFinancial && previousFinancial && previousFinancial.revenue !== 0
      ? ((latestFinancial.revenue - previousFinancial.revenue) / Math.abs(previousFinancial.revenue)) * 100
      : undefined;
  const priceMove = snapshot.quote.changesPercentage;
  const eventCount = snapshot.upcomingEvents.length;
  const behaviorCount = snapshot.insiders.length + snapshot.congress.length;
  const technicalScore = scoreValue(research, "technical");

  return [
    {
      category: "price",
      label: "Price",
      direction: priceMove > 0 ? "positive" : priceMove < 0 ? "negative" : "neutral",
      detail: `${formatPercent(priceMove)} today at ${formatCurrency(snapshot.quote.price, false)}`
    },
    {
      category: "fundamentals",
      label: "Fundamentals",
      direction: badgeDirectionFromScore(scoreValue(research, "quality")),
      detail: `Quality ${scoreValue(research, "quality")}/100; revenue ${formatPercent(revenueGrowth, 1)}`
    },
    {
      category: "estimates",
      label: "Estimates",
      direction:
        (estimate?.epsRevisionPercent ?? 0) > 1
          ? "positive"
          : (estimate?.epsRevisionPercent ?? 0) < -1
            ? "negative"
            : "neutral",
      detail: `EPS revisions ${formatPercent(estimate?.epsRevisionPercent, 1)}`
    },
    {
      category: "events",
      label: "Events",
      direction: snapshot.upcomingEvents.some((event) => event.severity === "high") ? "mixed" : "neutral",
      detail: eventCount ? `${eventCount} upcoming catalyst${eventCount === 1 ? "" : "s"}` : "No loaded catalyst"
    },
    {
      category: "filings",
      label: "Filings",
      direction: latestFiling?.formType === "8-K" ? "mixed" : "neutral",
      detail: latestFiling ? `${latestFiling.formType} on ${latestFiling.filingDate}` : "No recent filing"
    },
    {
      category: "behavior",
      label: "Insider/Congress",
      direction: badgeDirectionFromScore(scoreValue(research, "behavior")),
      detail: `${behaviorCount} disclosure${behaviorCount === 1 ? "" : "s"} loaded`
    },
    {
      category: "technical",
      label: "Technical",
      direction: badgeDirectionFromScore(technicalScore),
      detail: latestTechnical ? `RSI ${latestTechnical.rsi?.toFixed(0) ?? "N/A"}` : "No technical data"
    }
  ];
}

export async function getEnrichedWatchlist() {
  const watchlist = await getWatchlist();
  const items = await Promise.all(
    watchlist.items.map(async (item) => {
      const model = await getCompanyResearch(item.symbol);
      return {
        ...item,
        name: model.snapshot.profile.name,
        price: model.snapshot.quote.price,
        changePercent: model.snapshot.quote.changesPercentage,
        topSignal: model.signals[0]?.title ?? "No signal computed",
        score: Math.round(
          model.scores
            .filter((score) => ["quality", "valuation", "expectations"].includes(score.scoreType))
            .reduce((sum, score) => sum + score.score, 0) / 3
        ),
        changeBadges: buildChangeBadges(model)
      };
    })
  );

  return {
    ...watchlist,
    items
  };
}
