import { NextResponse } from "next/server";
import { getCompanyResearch } from "@/lib/server/research";
import type { CompanyScore, Evidence } from "@/lib/types";

const scoreTypes: CompanyScore["scoreType"][] = [
  "quality",
  "growth",
  "profitability",
  "balance_sheet",
  "cash_flow"
];
const evidenceSources: Evidence["source"][] = [
  "fmp_financial_statement",
  "fmp_key_metrics",
  "fmp_ratios",
  "fmp_financial_scores",
  "fmp_owner_earnings"
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const research = await getCompanyResearch(symbol);

  return NextResponse.json({
    symbol: research.snapshot.profile.symbol,
    financials: research.snapshot.financials,
    metrics: research.snapshot.metrics,
    financialScores: research.snapshot.scores,
    scores: research.scores.filter((score) => scoreTypes.includes(score.scoreType)),
    evidence: research.evidence.filter((item) => evidenceSources.includes(item.source)),
    refreshedAt: research.snapshot.dataStatus.refreshedAt
  });
}
