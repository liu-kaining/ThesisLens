import { createHash } from "crypto";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/format";
import { scoreLabelZh } from "@/lib/labels";
import type { CompanyScore, Evidence, ResearchMemo, ResearchSnapshot, Signal } from "@/lib/types";

function factsHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
}

function findScore(scores: CompanyScore[], type: CompanyScore["scoreType"]) {
  return scores.find((score) => score.scoreType === type);
}

function evidenceIdsBySource(evidence: Evidence[], source: string, limit = 4) {
  return evidence
    .filter((item) => item.source.includes(source))
    .slice(0, limit)
    .map((item) => item.id);
}

export async function buildResearchMemo(
  snapshot: ResearchSnapshot,
  scores: CompanyScore[],
  signals: Signal[],
  evidence: Evidence[]
): Promise<ResearchMemo> {
  return buildDeterministicMemo(snapshot, scores, signals, evidence);
}

function buildDeterministicMemo(
  snapshot: ResearchSnapshot,
  scores: CompanyScore[],
  signals: Signal[],
  evidence: Evidence[]
): ResearchMemo {
  const quality = findScore(scores, "quality");
  const valuation = findScore(scores, "valuation");
  const expectations = findScore(scores, "expectations");
  const behavior = findScore(scores, "behavior");
  const latestFinancial = snapshot.financials[0];
  const previousFinancial = snapshot.financials[1];
  const latestMetric = snapshot.metrics[0];
  const estimate = snapshot.analystEstimates[0];
  const revenueGrowth =
    latestFinancial && previousFinancial
      ? ((latestFinancial.revenue - previousFinancial.revenue) / previousFinancial.revenue) * 100
      : undefined;
  const hash = factsHash({
    symbol: snapshot.profile.symbol,
    refreshedAt: snapshot.dataStatus.refreshedAt,
    scores: scores.map((score) => [score.scoreType, score.score]),
    signals: signals.map((signal) => signal.id)
  });
  const allEvidenceIds = evidence.slice(0, 16).map((item) => item.id);

  return {
    symbol: snapshot.profile.symbol,
    generatedAt: new Date().toISOString(),
    factsHash: hash,
    model: "rules",
    executiveSummary: `${snapshot.profile.name} 是一家 ${snapshot.profile.sector} 公司，当前基本面质量为${quality ? scoreLabelZh(quality.label) : "数据不足"}，估值为${valuation ? scoreLabelZh(valuation.label) : "数据不足"}，预期动量为${expectations ? scoreLabelZh(expectations.label) : "数据不足"}。这不是买卖建议；更适合从现金创造、预期修正、估值偏离、事件催化和行为披露之间的关系来研究。`,
    whatChanged: {
      summary: `${signals[0]?.summary ?? "最近变化来自已载入的 FMP 数据。"} 当日股价变动为 ${formatPercent(snapshot.quote.changesPercentage, 1)}。`,
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "quote", 1),
        ...evidenceIdsBySource(evidence, "financial", 2)
      ],
      confidence: "medium"
    },
    businessQuality: {
      summary: `基本面质量分为 ${quality?.score ?? "N/A"}/100。最近一期收入为 ${formatCurrency(latestFinancial?.revenue)}，自由现金流为 ${formatCurrency(latestFinancial?.freeCashFlow)}，收入增长 ${formatPercent(revenueGrowth, 1)}，营业利润率 ${formatPercent(latestMetric?.operatingMargin, 1)}。`,
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "financial", 3),
        ...evidenceIdsBySource(evidence, "scores", 2),
        ...evidenceIdsBySource(evidence, "ratios", 2)
      ],
      confidence: quality ? "high" : "low"
    },
    valuation: {
      summary: `估值分为 ${valuation?.score ?? "N/A"}/100。当前市盈率约 ${formatRatio(snapshot.quote.pe, "x")}，DCF 公允价值为 ${formatCurrency(snapshot.valuation.dcf, false)}，一致目标价为 ${formatCurrency(snapshot.priceTarget.targetConsensus, false)}。`,
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "valuation", 2),
        ...evidenceIdsBySource(evidence, "price", 2),
        ...evidenceIdsBySource(evidence, "ratios", 1)
      ],
      confidence: valuation ? "medium" : "low"
    },
    expectations: {
      summary: `预期分为 ${expectations?.score ?? "N/A"}/100。分析师当前对 ${estimate?.fiscalYear ?? "N/A"} 财年 EPS 的平均预期为 ${estimate?.estimatedEpsAvg ?? "N/A"}，EPS 修正为 ${formatPercent(estimate?.epsRevisionPercent, 1)}，收入修正为 ${formatPercent(estimate?.revenueRevisionPercent, 1)}。`,
      evidenceIds: evidenceIdsBySource(evidence, "analyst", 3),
      confidence: estimate ? "high" : "low"
    },
    catalystsAndRisks: {
      summary: snapshot.upcomingEvents.length
        ? `下一个已载入催化剂是 ${snapshot.upcomingEvents[0].date} 的 ${snapshot.upcomingEvents[0].title}。需要检查它是否改变原 thesis 的关键驱动。`
        : "当前没有载入高优先级催化剂；应继续跟踪 SEC 文件、公告、新闻和后续财报日历接入。",
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "filing", 2),
        ...evidenceIdsBySource(evidence, "news", 2)
      ],
      confidence:
        snapshot.upcomingEvents.length ||
        snapshot.filings.length ||
        snapshot.news.length
          ? "medium"
          : "low"
    },
    behaviorSignals: {
      summary: `行为信号分为 ${behavior?.score ?? "N/A"}/100。ThesisLens 当前载入 ${snapshot.insiders.length} 条内幕交易披露和 ${snapshot.congress.length} 条国会交易披露。这些信号只能作为背景，不能视为管理层或政治人物态度的证明。`,
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "insider", 2),
        ...evidenceIdsBySource(evidence, "congress", 2)
      ],
      confidence: behavior ? "medium" : "low"
    },
    bullCase: {
      summary:
        "多头 case 依赖于收入增长持续、利润率稳定、预期继续上修，并且现金创造足以解释当前估值溢价。",
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "financial", 2),
        ...evidenceIdsBySource(evidence, "analyst", 2)
      ],
      confidence: "medium"
    },
    bearCase: {
      summary:
        "空头 case 在于当前估值可能已经反映了较强执行。若预期修正放缓、利润率承压或事件流转弱，估值倍数可能被压缩。",
      evidenceIds: [
        ...evidenceIdsBySource(evidence, "valuation", 2),
        ...evidenceIdsBySource(evidence, "filing", 1),
        ...evidenceIdsBySource(evidence, "news", 1)
      ],
      confidence: "medium"
    },
    keyQuestions: [
      "收入和 EPS 预期上修是否来自同一业务驱动，还是只依赖利润率扩张？",
      "相对同行而言，当前估值溢价是否被质量和增长共同支撑？",
      "哪些 SEC 文件、财报事件或公告可能改变原 thesis？",
      "内幕或国会交易披露是否真的强化 thesis，还是只是常规背景信息？",
      "哪个数据点会证明这个 thesis 是错的？"
    ],
    evidenceIds: allEvidenceIds
  };
}
