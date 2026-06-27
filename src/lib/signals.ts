import {
  clamp,
  formatCurrency,
  formatPercent,
  formatRatio,
  scoreLabel
} from "@/lib/format";
import { scoreLabelZh } from "@/lib/labels";
import type {
  CompanyScore,
  Direction,
  Evidence,
  ResearchSnapshot,
  Signal
} from "@/lib/types";

function evidenceId(symbol: string, source: string, key: string) {
  return `${symbol.toLowerCase()}-${source}-${key}`.replace(/[^a-z0-9-]/g, "-");
}

function latest<T>(items: T[]) {
  return items[0];
}

function safePercentChange(current?: number, previous?: number) {
  if (!current || !previous) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function directionFromDelta(delta: number, positiveThreshold = 1, negativeThreshold = -1): Direction {
  if (delta >= positiveThreshold) return "positive";
  if (delta <= negativeThreshold) return "negative";
  return "neutral";
}

export function buildEvidence(snapshot: ResearchSnapshot): Evidence[] {
  const symbol = snapshot.profile.symbol;
  const currentFinancial = latest(snapshot.financials);
  const previousFinancial = snapshot.financials[1];
  const currentMetric = latest(snapshot.metrics);
  const estimate = latest(snapshot.analystEstimates);
  const latestTechnical = snapshot.technicals.at(-1);
  const latestFiling = latest(snapshot.filings);
  const latestNews = latest(snapshot.news);
  const latestInsider = latest(snapshot.insiders);
  const latestCongress = latest(snapshot.congress);

  const evidence: Evidence[] = [
    {
      id: evidenceId(symbol, "profile", "market-cap"),
      symbol,
      source: "fmp_profile",
      label: "市值",
      value: snapshot.profile.marketCap ?? snapshot.quote.marketCap,
      unit: "USD",
      timestamp: snapshot.dataStatus.refreshedAt
    },
    {
      id: evidenceId(symbol, "quote", "price-change"),
      symbol,
      source: "fmp_quote",
      label: "日内涨跌幅",
      value: snapshot.quote.changesPercentage,
      unit: "%",
      timestamp: snapshot.quote.timestamp
    },
    {
      id: evidenceId(symbol, "financial", "revenue-growth"),
      symbol,
      source: "fmp_financial_statement",
      label: "收入同比增长",
      value: safePercentChange(currentFinancial?.revenue, previousFinancial?.revenue),
      unit: "%",
      period: currentFinancial ? `${currentFinancial.fiscalYear}` : undefined
    },
    {
      id: evidenceId(symbol, "financial", "fcf"),
      symbol,
      source: "fmp_financial_statement",
      label: "自由现金流",
      value: currentFinancial?.freeCashFlow ?? null,
      unit: "USD",
      period: currentFinancial ? `${currentFinancial.fiscalYear}` : undefined
    },
    {
      id: evidenceId(symbol, "ratios", "operating-margin"),
      symbol,
      source: "fmp_ratios",
      label: "营业利润率",
      value: currentMetric?.operatingMargin ?? null,
      unit: "%",
      period: currentMetric ? `${currentMetric.fiscalYear}` : undefined
    },
    {
      id: evidenceId(symbol, "ratios", "net-margin"),
      symbol,
      source: "fmp_ratios",
      label: "净利率",
      value: currentMetric?.netMargin ?? null,
      unit: "%",
      period: currentMetric ? `${currentMetric.fiscalYear}` : undefined
    },
    {
      id: evidenceId(symbol, "scores", "piotroski"),
      symbol,
      source: "fmp_financial_scores",
      label: "Piotroski 分数",
      value: snapshot.scores.piotroskiScore ?? null,
      period: "latest"
    },
    {
      id: evidenceId(symbol, "scores", "altman"),
      symbol,
      source: "fmp_financial_scores",
      label: "Altman Z 分数",
      value: snapshot.scores.altmanZScore ?? null,
      period: "latest"
    },
    {
      id: evidenceId(symbol, "valuation", "pe"),
      symbol,
      source: "fmp_ratios",
      label: "市盈率",
      value: currentMetric?.peRatio ?? snapshot.quote.pe ?? null,
      period: "latest"
    },
    {
      id: evidenceId(symbol, "valuation", "dcf"),
      symbol,
      source: "fmp_enterprise_values",
      label: "DCF 公允价值",
      value: snapshot.valuation.dcf ?? null,
      unit: "USD",
      period: "latest"
    },
    {
      id: evidenceId(symbol, "analyst", "eps-revision"),
      symbol,
      source: "fmp_analyst_estimates",
      label: "EPS 预期修正",
      value: estimate?.epsRevisionPercent ?? null,
      unit: "%",
      period: estimate ? `${estimate.fiscalYear}` : undefined
    },
    {
      id: evidenceId(symbol, "price-target", "consensus"),
      symbol,
      source: "fmp_price_target",
      label: "一致目标价",
      value: snapshot.priceTarget.targetConsensus ?? null,
      unit: "USD",
      timestamp: snapshot.priceTarget.updatedAt
    }
  ];

  if (latestTechnical) {
    evidence.push(
      {
        id: evidenceId(symbol, "technical", "rsi"),
        symbol,
        source: "fmp_technical",
        label: "RSI 相对强弱指标",
        value: latestTechnical.rsi ?? null,
        timestamp: latestTechnical.date
      },
      {
        id: evidenceId(symbol, "technical", "sma-trend"),
        symbol,
        source: "fmp_technical",
        label: "价格相对 50 日均线",
        value:
          latestTechnical.sma50 && latestTechnical.close
            ? safePercentChange(latestTechnical.close, latestTechnical.sma50)
            : null,
        unit: "%",
        timestamp: latestTechnical.date
      }
    );
  }

  if (latestNews) {
    evidence.push({
      id: evidenceId(symbol, "news", "latest"),
      symbol,
      source: "fmp_news",
      label: latestNews.title,
      value: latestNews.summary,
      timestamp: latestNews.publishedAt,
      url: latestNews.url
    });
  }

  if (latestFiling) {
    evidence.push({
      id: evidenceId(symbol, "filing", latestFiling.id),
      symbol,
      source: "fmp_sec_filing",
      label: `${latestFiling.formType} 文件`,
      value: latestFiling.title,
      timestamp: latestFiling.filingDate,
      url: latestFiling.url
    });
  }

  if (latestInsider) {
    evidence.push({
      id: evidenceId(symbol, "insider", latestInsider.id),
      symbol,
      source: "fmp_insider",
      label: `${latestInsider.reportingName} ${latestInsider.transactionType}`,
      value: latestInsider.value ?? null,
      unit: "USD",
      timestamp: latestInsider.transactionDate,
      metadata: {
        role: latestInsider.role,
        shares: latestInsider.shares
      }
    });
  }

  if (latestCongress) {
    evidence.push({
      id: evidenceId(symbol, "congress", latestCongress.id),
      symbol,
      source: "fmp_congress",
      label: `${latestCongress.chamber} ${latestCongress.transactionType}`,
      value:
        latestCongress.amountMin && latestCongress.amountMax
          ? `${formatCurrency(latestCongress.amountMin)} - ${formatCurrency(latestCongress.amountMax)}`
          : latestCongress.transactionType,
      timestamp: latestCongress.transactionDate,
      metadata: {
        representativeName: latestCongress.representativeName,
        state: latestCongress.state,
        assetDescription: latestCongress.assetDescription
      }
    });
  }

  return evidence;
}

export function computeScores(snapshot: ResearchSnapshot, evidence: Evidence[]): CompanyScore[] {
  const symbol = snapshot.profile.symbol;
  const now = new Date().toISOString();
  const currentFinancial = latest(snapshot.financials);
  const previousFinancial = snapshot.financials[1];
  const currentMetric = latest(snapshot.metrics);
  const estimate = latest(snapshot.analystEstimates);
  const latestTechnical = snapshot.technicals.at(-1);

  const revenueGrowth = safePercentChange(currentFinancial?.revenue, previousFinancial?.revenue);
  const fcfMargin =
    currentFinancial && currentFinancial.revenue !== 0
      ? (currentFinancial.freeCashFlow / currentFinancial.revenue) * 100
      : 0;
  const hasFcfMargin = Boolean(
    currentFinancial && currentFinancial.revenue !== 0
  );
  const dcfGap = snapshot.valuation.dcf
    ? ((snapshot.valuation.dcf - snapshot.quote.price) / snapshot.quote.price) * 100
    : 0;
  const priceTargetGap = snapshot.priceTarget.targetConsensus
    ? ((snapshot.priceTarget.targetConsensus - snapshot.quote.price) / snapshot.quote.price) * 100
    : 0;
  const smaGap =
    latestTechnical?.sma50 && latestTechnical.close
      ? safePercentChange(latestTechnical.close, latestTechnical.sma50)
      : 0;
  const rsi = latestTechnical?.rsi ?? 50;
  const insiderSignal = snapshot.insiders.some((item) =>
    item.transactionType.toLowerCase().includes("purchase")
  )
    ? 12
    : snapshot.insiders.length > 0
      ? -4
      : 0;
  const congressSignal = snapshot.congress.some((item) =>
    item.transactionType.toLowerCase().includes("purchase")
  )
    ? 5
    : snapshot.congress.length > 0
      ? -2
      : 0;

  const quality = clamp(
    50 +
      (snapshot.scores.piotroskiScore !== undefined
        ? (snapshot.scores.piotroskiScore - 5) * 6
        : 0) +
      (snapshot.scores.altmanZScore !== undefined
        ? (Math.min(snapshot.scores.altmanZScore, 10) - 3) * 3
        : 0) +
      (currentMetric?.operatingMargin !== undefined
        ? (Math.min(currentMetric.operatingMargin, 50) - 15) * 0.5
        : 0) +
      (hasFcfMargin ? (Math.min(fcfMargin, 35) - 8) * 0.6 : 0)
  );
  const growth = clamp(50 + revenueGrowth * 1.6 + (estimate?.revenueRevisionPercent ?? 0) * 2);
  const profitability = clamp(
    50 +
      (currentMetric?.grossMargin !== undefined
        ? (Math.min(currentMetric.grossMargin, 80) - 40) * 0.25
        : 0) +
      (currentMetric?.operatingMargin !== undefined
        ? (Math.min(currentMetric.operatingMargin, 60) - 15) * 0.5
        : 0) +
      (currentMetric?.netMargin !== undefined
        ? (Math.min(currentMetric.netMargin, 55) - 10) * 0.4
        : 0)
  );
  const balanceSheet = clamp(
    50 +
      (currentMetric?.currentRatio !== undefined
        ? (currentMetric.currentRatio - 1) * 12
        : 0) -
      (currentMetric?.debtToEquity !== undefined
        ? (currentMetric.debtToEquity - 0.7) * 12
        : 0) +
      (snapshot.scores.altmanZScore !== undefined
        ? (Math.min(snapshot.scores.altmanZScore, 8) - 3) * 3
        : 0)
  );
  const cashFlow = clamp(50 + (fcfMargin - 8) * 1.5);
  const valuation = clamp(
    50 +
      dcfGap * 0.35 +
      priceTargetGap * 0.25 -
      Math.max((snapshot.valuation.historicalPePercentile ?? 50) - 50, 0) * 0.45
  );
  const expectations = clamp(
    50 +
      (estimate?.epsRevisionPercent ?? 0) * 4 +
      (estimate?.revenueRevisionPercent ?? 0) * 2 +
      priceTargetGap * 0.2
  );
  const technical = clamp(50 + smaGap * 1.4 - Math.max(rsi - 70, 0) * 1.8 + Math.max(45 - rsi, 0));
  const events = clamp(64 - snapshot.upcomingEvents.filter((event) => event.severity === "high").length * 10);
  const behavior = clamp(52 + insiderSignal + congressSignal);

  const evidenceIds = (sources: string[]) =>
    evidence
      .filter((item) => sources.some((source) => item.source.includes(source)))
      .slice(0, 4)
      .map((item) => item.id);
  const usableModule = (key: string) =>
    snapshot.dataStatus.modules?.some(
      (module) =>
        module.key === key &&
        (module.status === "live" || module.status === "stale")
    ) ?? false;
  const availableScoreTypes = new Set<CompanyScore["scoreType"]>();
  const qualityInputCount = [
    snapshot.scores.piotroskiScore,
    snapshot.scores.altmanZScore,
    currentMetric?.operatingMargin,
    hasFcfMargin ? fcfMargin : undefined
  ].filter((value) => value !== undefined).length;
  if (currentFinancial && qualityInputCount >= 2) {
    availableScoreTypes.add("quality");
  }
  if (
    (currentFinancial && previousFinancial) ||
    estimate?.revenueRevisionPercent !== undefined
  ) {
    availableScoreTypes.add("growth");
  }
  if (
    currentMetric &&
    [
      currentMetric.grossMargin,
      currentMetric.operatingMargin,
      currentMetric.netMargin
    ].some((value) => value !== undefined)
  ) {
    availableScoreTypes.add("profitability");
  }
  if (
    currentMetric?.currentRatio !== undefined ||
    currentMetric?.debtToEquity !== undefined ||
    snapshot.scores.altmanZScore !== undefined
  ) {
    availableScoreTypes.add("balance_sheet");
  }
  if (
    currentFinancial?.freeCashFlow !== undefined &&
    currentFinancial.revenue !== 0
  ) {
    availableScoreTypes.add("cash_flow");
  }
  if (
    snapshot.quote.price > 0 &&
    (snapshot.valuation.dcf !== undefined ||
      snapshot.valuation.leveredDcf !== undefined ||
      snapshot.priceTarget.targetConsensus !== undefined)
  ) {
    availableScoreTypes.add("valuation");
  }
  if (
    estimate ||
    snapshot.rating.rating ||
    snapshot.priceTarget.targetConsensus !== undefined
  ) {
    availableScoreTypes.add("expectations");
  }
  if (
    latestTechnical?.close !== undefined &&
    latestTechnical.sma50 !== undefined &&
    latestTechnical.rsi !== undefined
  ) {
    availableScoreTypes.add("technical");
  }
  if (
    snapshot.upcomingEvents.length > 0 ||
    snapshot.filings.length > 0 ||
    snapshot.news.length > 0 ||
    usableModule("calendar") ||
    usableModule("sec") ||
    usableModule("news")
  ) {
    availableScoreTypes.add("events");
  }
  if (snapshot.insiders.length > 0 || snapshot.congress.length > 0) {
    availableScoreTypes.add("behavior");
  }

  const computedScores: CompanyScore[] = [
    {
      id: `${symbol}-quality-score`,
      symbol,
      scoreType: "quality",
      score: Math.round(quality),
      label: scoreLabel(quality),
      drivers: [
        {
          label: "Piotroski",
          direction: (snapshot.scores.piotroskiScore ?? 0) >= 7 ? "positive" : "mixed",
          value: `${snapshot.scores.piotroskiScore ?? "N/A"}/9`
        },
        {
          label: "营业利润率",
          direction: (currentMetric?.operatingMargin ?? 0) >= 25 ? "positive" : "mixed",
          value: formatPercent(currentMetric?.operatingMargin, 1)
        },
        {
          label: "自由现金流率",
          direction: fcfMargin >= 15 ? "positive" : "mixed",
          value: formatPercent(fcfMargin, 1)
        }
      ],
      evidenceIds: evidenceIds(["financial", "ratios", "scores"]),
      computedAt: now
    },
    {
      id: `${symbol}-growth-score`,
      symbol,
      scoreType: "growth",
      score: Math.round(growth),
      label: scoreLabel(growth),
      drivers: [
        {
          label: "收入增长",
          direction: directionFromDelta(revenueGrowth, 5, -2),
          value: formatPercent(revenueGrowth, 1)
        },
        {
          label: "收入预期修正",
          direction: directionFromDelta(estimate?.revenueRevisionPercent ?? 0),
          value: formatPercent(estimate?.revenueRevisionPercent, 1)
        }
      ],
      evidenceIds: evidenceIds(["financial", "analyst"]),
      computedAt: now
    },
    {
      id: `${symbol}-profitability-score`,
      symbol,
      scoreType: "profitability",
      score: Math.round(profitability),
      label: scoreLabel(profitability),
      drivers: [
        {
          label: "毛利率",
          direction: (currentMetric?.grossMargin ?? 0) >= 45 ? "positive" : "mixed",
          value: formatPercent(currentMetric?.grossMargin, 1)
        },
        {
          label: "净利率",
          direction: (currentMetric?.netMargin ?? 0) >= 20 ? "positive" : "mixed",
          value: formatPercent(currentMetric?.netMargin, 1)
        }
      ],
      evidenceIds: evidenceIds(["ratios"]),
      computedAt: now
    },
    {
      id: `${symbol}-balance-score`,
      symbol,
      scoreType: "balance_sheet",
      score: Math.round(balanceSheet),
      label: scoreLabel(balanceSheet),
      drivers: [
        {
          label: "流动比率",
          direction: (currentMetric?.currentRatio ?? 0) >= 1 ? "positive" : "negative",
          value: formatRatio(currentMetric?.currentRatio, "x")
        },
        {
          label: "负债/权益",
          direction: (currentMetric?.debtToEquity ?? 1) <= 0.8 ? "positive" : "mixed",
          value: formatRatio(currentMetric?.debtToEquity, "x")
        }
      ],
      evidenceIds: evidenceIds(["ratios", "scores"]),
      computedAt: now
    },
    {
      id: `${symbol}-cash-flow-score`,
      symbol,
      scoreType: "cash_flow",
      score: Math.round(cashFlow),
      label: scoreLabel(cashFlow),
      drivers: [
        {
          label: "自由现金流",
          direction: (currentFinancial?.freeCashFlow ?? 0) > 0 ? "positive" : "negative",
          value: formatCurrency(currentFinancial?.freeCashFlow)
        },
        {
          label: "自由现金流率",
          direction: fcfMargin >= 15 ? "positive" : "mixed",
          value: formatPercent(fcfMargin, 1)
        }
      ],
      evidenceIds: evidenceIds(["financial"]),
      computedAt: now
    },
    {
      id: `${symbol}-valuation-score`,
      symbol,
      scoreType: "valuation",
      score: Math.round(valuation),
      label: scoreLabel(valuation),
      drivers: [
        {
          label: "P/E",
          direction: (currentMetric?.peRatio ?? 100) <= (snapshot.valuation.industryPe ?? 30) ? "positive" : "mixed",
          value: formatRatio(currentMetric?.peRatio ?? snapshot.quote.pe, "x")
        },
        {
          label: "DCF 偏离",
          direction: directionFromDelta(dcfGap, 5, -5),
          value: formatPercent(dcfGap, 1)
        },
        {
          label: "目标价空间",
          direction: directionFromDelta(priceTargetGap, 5, -5),
          value: formatPercent(priceTargetGap, 1)
        }
      ],
      evidenceIds: evidenceIds(["valuation", "price"]),
      computedAt: now
    },
    {
      id: `${symbol}-expectations-score`,
      symbol,
      scoreType: "expectations",
      score: Math.round(expectations),
      label: scoreLabel(expectations),
      drivers: [
        {
          label: "EPS 预期修正",
          direction: directionFromDelta(estimate?.epsRevisionPercent ?? 0),
          value: formatPercent(estimate?.epsRevisionPercent, 1)
        },
        {
          label: "覆盖分析师数",
          direction: (estimate?.analysts ?? 0) >= 15 ? "positive" : "neutral",
          value: `${estimate?.analysts ?? "N/A"}`
        }
      ],
      evidenceIds: evidenceIds(["analyst", "price"]),
      computedAt: now
    },
    {
      id: `${symbol}-technical-score`,
      symbol,
      scoreType: "technical",
      score: Math.round(technical),
      label: scoreLabel(technical),
      drivers: [
        {
          label: "价格/50 日均线",
          direction: directionFromDelta(smaGap, 2, -2),
          value: formatPercent(smaGap, 1)
        },
        {
          label: "RSI",
          direction: rsi > 72 ? "negative" : rsi > 55 ? "positive" : "neutral",
          value: `${rsi.toFixed(0)}`
        }
      ],
      evidenceIds: evidenceIds(["technical"]),
      computedAt: now
    },
    {
      id: `${symbol}-events-score`,
      symbol,
      scoreType: "events",
      score: Math.round(events),
      label: scoreLabel(events),
      drivers: [
        {
          label: "近期事件",
          direction: snapshot.upcomingEvents.some((event) => event.severity === "high") ? "mixed" : "neutral",
          value: `${snapshot.upcomingEvents.length}`
        },
        {
          label: "近期 SEC 文件",
          direction: snapshot.filings.some((filing) => filing.formType === "8-K") ? "mixed" : "neutral",
          value: `${snapshot.filings.length}`
        }
      ],
      evidenceIds: evidenceIds(["filing", "news"]),
      computedAt: now
    },
    {
      id: `${symbol}-behavior-score`,
      symbol,
      scoreType: "behavior",
      score: Math.round(behavior),
      label: scoreLabel(behavior),
      drivers: [
        {
          label: "内幕交易披露",
          direction: insiderSignal > 0 ? "positive" : insiderSignal < 0 ? "mixed" : "neutral",
          value: `${snapshot.insiders.length}`
        },
        {
          label: "国会交易披露",
          direction: congressSignal > 0 ? "positive" : congressSignal < 0 ? "mixed" : "neutral",
          value: `${snapshot.congress.length}`
        }
      ],
      evidenceIds: evidenceIds(["insider", "congress"]),
      computedAt: now
    }
  ];

  return computedScores.filter((score) =>
    availableScoreTypes.has(score.scoreType)
  );
}

export function computeSignals(
  snapshot: ResearchSnapshot,
  scores: CompanyScore[],
  evidence: Evidence[]
): Signal[] {
  const symbol = snapshot.profile.symbol;
  const now = new Date().toISOString();
  const byType = (scoreType: CompanyScore["scoreType"]) =>
    scores.find((score) => score.scoreType === scoreType);
  const evidenceBySource = (source: string) =>
    evidence
      .filter((item) => item.source.includes(source))
      .slice(0, 3)
      .map((item) => item.id);
  const uniqueEvidenceIds = (ids: string[], limit: number) => Array.from(new Set(ids)).slice(0, limit);
  const currentFinancial = latest(snapshot.financials);
  const previousFinancial = snapshot.financials[1];
  const revenueGrowth = safePercentChange(currentFinancial?.revenue, previousFinancial?.revenue);
  const estimate = latest(snapshot.analystEstimates);
  const valuationScore = byType("valuation");
  const qualityScore = byType("quality");
  const expectationsScore = byType("expectations");
  const behaviorScore = byType("behavior");
  const technicalScore = byType("technical");

  const computedSignals: Signal[] = [
    {
      id: `${symbol}-signal-quality`,
      symbol,
      category: "quality",
      direction: (qualityScore?.score ?? 0) >= 70 ? "positive" : "mixed",
      severity: "high",
      confidence: 0.86,
      title: `${snapshot.profile.name} 的基本面质量为${qualityScore ? scoreLabelZh(qualityScore.label) : "分歧"}`,
      summary: `最新基本面显示收入增长 ${formatPercent(revenueGrowth, 1)}，自由现金流 ${formatCurrency(currentFinancial?.freeCashFlow)}，Piotroski 分数为 ${snapshot.scores.piotroskiScore ?? "N/A"}。`,
      evidenceIds: uniqueEvidenceIds([
        ...evidenceBySource("financial"),
        ...evidenceBySource("scores"),
        ...evidenceBySource("ratios")
      ], 5),
      computedAt: now
    },
    {
      id: `${symbol}-signal-valuation`,
      symbol,
      category: "valuation",
      direction: (valuationScore?.score ?? 50) >= 62 ? "positive" : (valuationScore?.score ?? 50) < 45 ? "negative" : "mixed",
      severity: "high",
      confidence: 0.74,
      title: `估值相对历史、模型值和目标价呈现${valuationScore ? scoreLabelZh(valuationScore.label) : "分歧"}`,
      summary: `当前股价约为 ${formatRatio(snapshot.quote.pe, "x")} 盈利，DCF 估值为 ${formatCurrency(snapshot.valuation.dcf, false)}，一致目标价为 ${formatCurrency(snapshot.priceTarget.targetConsensus, false)}。`,
      evidenceIds: uniqueEvidenceIds([
        ...evidenceBySource("valuation"),
        ...evidenceBySource("price"),
        ...evidenceBySource("ratios")
      ], 5),
      computedAt: now
    },
    {
      id: `${symbol}-signal-expectations`,
      symbol,
      category: "expectations",
      direction: (estimate?.epsRevisionPercent ?? 0) > 1 ? "positive" : (estimate?.epsRevisionPercent ?? 0) < -1 ? "negative" : "neutral",
      severity: "medium",
      confidence: 0.81,
      title: `分析师预期动量为${expectationsScore ? scoreLabelZh(expectationsScore.label) : "分歧"}`,
      summary: `${estimate?.fiscalYear ?? "N/A"} 财年的 EPS 预期修正为 ${formatPercent(estimate?.epsRevisionPercent, 1)}，收入预期修正为 ${formatPercent(estimate?.revenueRevisionPercent, 1)}。`,
      evidenceIds: uniqueEvidenceIds([...evidenceBySource("analyst"), ...evidenceBySource("price")], 4),
      computedAt: now
    },
    {
      id: `${symbol}-signal-events`,
      symbol,
      category: "events",
      direction: snapshot.upcomingEvents.some((event) => event.severity === "high") ? "mixed" : "neutral",
      severity: snapshot.upcomingEvents.some((event) => event.severity === "high") ? "high" : "medium",
      confidence: 0.72,
      title: `事件与公告流需要作为 thesis 压力测试`,
      summary: snapshot.upcomingEvents[0]
        ? `${snapshot.upcomingEvents[0].title}: ${snapshot.upcomingEvents[0].description ?? "需要评估时间点与 thesis 影响。"}`
        : `当前载入 ${snapshot.filings.length} 条 SEC 文件和 ${snapshot.news.length} 条新闻/公告；尚未接入实时财报日历时，不用示例事件填充。`,
      evidenceIds: uniqueEvidenceIds([...evidenceBySource("filing"), ...evidenceBySource("news")], 4),
      computedAt: now
    },
    {
      id: `${symbol}-signal-behavior`,
      symbol,
      category: "behavior",
      direction: (behaviorScore?.score ?? 50) >= 60 ? "positive" : (behaviorScore?.score ?? 50) < 45 ? "negative" : "mixed",
      severity: "medium",
      confidence: 0.64,
      title: "内幕与国会交易只能作为背景信号，不能单独构成 thesis",
      summary: `当前载入 ${snapshot.insiders.length} 条内幕交易披露和 ${snapshot.congress.length} 条国会交易披露。若实时端点不可用，本模块不会展示示例交易。`,
      evidenceIds: uniqueEvidenceIds([...evidenceBySource("insider"), ...evidenceBySource("congress")], 4),
      computedAt: now
    },
    {
      id: `${symbol}-signal-technical`,
      symbol,
      category: "technical",
      direction: (technicalScore?.score ?? 50) >= 62 ? "positive" : (technicalScore?.score ?? 50) < 45 ? "negative" : "mixed",
      severity: "low",
      confidence: 0.67,
      title: "技术面用于观察入场节奏，不替代基本面 thesis",
      summary: `最新技术面分数为 ${technicalScore?.score ?? "N/A"}，主要来自价格趋势、均线偏离、RSI 与近期成交量背景。`,
      evidenceIds: uniqueEvidenceIds(evidenceBySource("technical"), 3),
      computedAt: now
    }
  ];

  return computedSignals.filter((signal) => {
    if (signal.category === "quality") return Boolean(qualityScore);
    if (signal.category === "valuation") return Boolean(valuationScore);
    if (signal.category === "expectations") return Boolean(expectationsScore);
    if (signal.category === "behavior") return Boolean(behaviorScore);
    if (signal.category === "technical") return Boolean(technicalScore);
    return true;
  });
}
