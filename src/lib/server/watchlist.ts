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
      label: "价格",
      direction: priceMove > 0 ? "positive" : priceMove < 0 ? "negative" : "neutral",
      detail: `今日 ${formatPercent(priceMove)}，当前价 ${formatCurrency(snapshot.quote.price, false)}`
    },
    {
      category: "fundamentals",
      label: "基本面",
      direction: badgeDirectionFromScore(scoreValue(research, "quality")),
      detail: `质量分 ${scoreValue(research, "quality")}/100；收入增长 ${formatPercent(revenueGrowth, 1)}`
    },
    {
      category: "estimates",
      label: "预期",
      direction:
        (estimate?.epsRevisionPercent ?? 0) > 1
          ? "positive"
          : (estimate?.epsRevisionPercent ?? 0) < -1
            ? "negative"
            : "neutral",
      detail: `EPS 预期修正 ${formatPercent(estimate?.epsRevisionPercent, 1)}`
    },
    {
      category: "events",
      label: "事件",
      direction: snapshot.upcomingEvents.some((event) => event.severity === "high") ? "mixed" : "neutral",
      detail: eventCount ? `${eventCount} 个近期催化剂` : "暂无已载入催化剂"
    },
    {
      category: "filings",
      label: "SEC",
      direction: latestFiling?.formType === "8-K" ? "mixed" : "neutral",
      detail: latestFiling ? `${latestFiling.filingDate} 的 ${latestFiling.formType}` : "暂无近期文件"
    },
    {
      category: "behavior",
      label: "行为",
      direction: badgeDirectionFromScore(scoreValue(research, "behavior")),
      detail: `已载入 ${behaviorCount} 条披露`
    },
    {
      category: "technical",
      label: "技术面",
      direction: badgeDirectionFromScore(technicalScore),
      detail: latestTechnical ? `RSI ${latestTechnical.rsi?.toFixed(0) ?? "N/A"}` : "暂无技术面数据"
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
        topSignal: model.signals[0]?.title ?? "暂无计算信号",
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
