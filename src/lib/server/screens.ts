import { getCompanyResearch } from "@/lib/server/research";
import { getResearchUniverse, type ResearchUniverse } from "@/lib/server/universe";
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

export type ResearchScreensModel = {
  generatedAt: string;
  universe: ResearchUniverse;
  screens: ResearchScreen[];
};

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

export async function getResearchScreens(): Promise<ResearchScreensModel> {
  const universe = await getResearchUniverse();
  const models = await Promise.all(universe.symbols.map((symbol) => getCompanyResearch(symbol)));

  const highQuality = models
    .filter((model) => scoreValue(model.scores, "quality") >= 75)
    .map((model) =>
      resultFromResearch(
        model,
        "基本面质量较强；下一步研究估值溢价是否合理。",
        "positive"
      )
    )
    .sort((a, b) => b.quality - a.quality);

  const revisionMomentum = models
    .filter((model) => scoreValue(model.scores, "expectations") >= 62)
    .map((model) =>
      resultFromResearch(
        model,
        "分析师预期正在改善；需要比较预期修正强度和近期股价反应。",
        "positive"
      )
    )
    .sort((a, b) => b.expectations - a.expectations);

  const valuationQuestions = models
    .map((model) =>
      resultFromResearch(
        model,
        scoreValue(model.scores, "valuation") >= 60
          ? "相对已载入证据，估值不算敌意；需要拆解原因。"
          : "估值看起来偏贵；需要找到足够支撑估值的增长证据。",
        scoreValue(model.scores, "valuation") >= 60 ? "positive" : "mixed"
      )
    )
    .sort((a, b) => b.valuation - a.valuation);

  const eventRisk = models
    .map((model) =>
      resultFromResearch(
        model,
        "近期事件或 SEC 文件可能改变短期 thesis；需要复核催化剂。",
        scoreValue(model.scores, "events") < 58 ? "mixed" : "neutral"
      )
    )
    .sort((a, b) => b.eventRisk - a.eventRisk);

  return {
    generatedAt: new Date().toISOString(),
    universe,
    screens: [
      {
        id: "high-quality-pullbacks",
        title: "高质量公司",
        description:
          "质量、盈利能力和现金流证据较强，值得进一步做估值研究的公司。",
        results: highQuality
      },
      {
        id: "revision-momentum",
        title: "预期动量转强",
        description:
          "分析师预期修正和目标价证据正在改善的股票。",
        results: revisionMomentum
      },
      {
        id: "valuation-questions",
        title: "估值问题",
        description:
          "核心问题是价格、DCF、倍数和同行相对位置是否一致的标的。",
        results: valuationQuestions
      },
      {
        id: "event-risk",
        title: "事件风险观察",
        description:
          "近期财报、SEC 文件、披露或新闻流值得关注的公司。",
        results: eventRisk
      }
    ]
  };
}
