import { getCompanyResearch } from "@/lib/server/research";
import type { Direction } from "@/lib/types";

export type ScreenResult = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  quality: number;
  valuation: number;
  expectations: number;
  eventRisk: number;
  thesis: string;
  direction: Direction;
};

export type ResearchScreen = {
  id: string;
  title: string;
  description: string;
  results: ScreenResult[];
};

const DEFAULT_UNIVERSE = ["AAPL", "MSFT", "NVDA"];

function scoreValue(
  scores: Awaited<ReturnType<typeof getCompanyResearch>>["scores"],
  type: ScreenResultKey
) {
  return scores.find((score) => score.scoreType === type)?.score ?? 50;
}

type ScreenResultKey = "quality" | "valuation" | "expectations" | "events";

function resultFromResearch(
  research: Awaited<ReturnType<typeof getCompanyResearch>>,
  thesis: string,
  direction: Direction
): ScreenResult {
  return {
    symbol: research.snapshot.profile.symbol,
    name: research.snapshot.profile.name,
    price: research.snapshot.quote.price,
    changePercent: research.snapshot.quote.changesPercentage,
    quality: scoreValue(research.scores, "quality"),
    valuation: scoreValue(research.scores, "valuation"),
    expectations: scoreValue(research.scores, "expectations"),
    eventRisk: 100 - scoreValue(research.scores, "events"),
    thesis,
    direction
  };
}

export async function getResearchScreens(): Promise<ResearchScreen[]> {
  const models = await Promise.all(DEFAULT_UNIVERSE.map((symbol) => getCompanyResearch(symbol)));

  const highQuality = models
    .filter((model) => scoreValue(model.scores, "quality") >= 75)
    .map((model) =>
      resultFromResearch(
        model,
        "Business quality is strong; research whether the valuation premium is justified.",
        "positive"
      )
    )
    .sort((a, b) => b.quality - a.quality);

  const revisionMomentum = models
    .filter((model) => scoreValue(model.scores, "expectations") >= 62)
    .map((model) =>
      resultFromResearch(
        model,
        "Analyst expectations are improving; compare revision strength with recent price action.",
        "positive"
      )
    )
    .sort((a, b) => b.expectations - a.expectations);

  const valuationQuestions = models
    .map((model) =>
      resultFromResearch(
        model,
        scoreValue(model.scores, "valuation") >= 60
          ? "Valuation is not hostile relative to the loaded evidence; inspect why."
          : "Valuation appears demanding; identify the growth proof needed to defend it.",
        scoreValue(model.scores, "valuation") >= 60 ? "positive" : "mixed"
      )
    )
    .sort((a, b) => b.valuation - a.valuation);

  const eventRisk = models
    .map((model) =>
      resultFromResearch(
        model,
        "Upcoming events or filings could change the near-term thesis; review catalysts.",
        scoreValue(model.scores, "events") < 58 ? "mixed" : "neutral"
      )
    )
    .sort((a, b) => b.eventRisk - a.eventRisk);

  return [
    {
      id: "high-quality-pullbacks",
      title: "High Quality Companies",
      description:
        "Companies where quality, profitability, and cash-flow evidence are strong enough to deserve deeper valuation work.",
      results: highQuality
    },
    {
      id: "revision-momentum",
      title: "Positive Expectation Momentum",
      description:
        "Stocks where analyst estimate revisions and price target evidence are improving.",
      results: revisionMomentum
    },
    {
      id: "valuation-questions",
      title: "Valuation Questions",
      description:
        "Names where the core question is whether price, DCF, multiples, and peer context agree.",
      results: valuationQuestions
    },
    {
      id: "event-risk",
      title: "Event Risk Watch",
      description:
        "Companies where upcoming earnings, filings, disclosures, or news flow deserve attention.",
      results: eventRisk
    }
  ];
}

