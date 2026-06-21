import type { CompanyScore, Direction, EvidenceSource, SignalCategory, Severity } from "@/lib/types";

export function directionLabel(direction: Direction) {
  return (
    {
      positive: "利好",
      negative: "利空",
      neutral: "中性",
      mixed: "分歧"
    } satisfies Record<Direction, string>
  )[direction];
}

export function scoreLabelZh(label: CompanyScore["label"]) {
  return (
    {
      strong: "强",
      good: "良好",
      mixed: "分歧",
      weak: "偏弱"
    } satisfies Record<CompanyScore["label"], string>
  )[label];
}

export function scoreTypeLabel(scoreType: CompanyScore["scoreType"]) {
  return (
    {
      quality: "基本面质量",
      growth: "增长",
      profitability: "盈利能力",
      balance_sheet: "资产负债表",
      cash_flow: "现金流",
      valuation: "估值",
      expectations: "分析师预期",
      technical: "技术面",
      events: "事件风险",
      behavior: "行为信号"
    } satisfies Record<CompanyScore["scoreType"], string>
  )[scoreType];
}

export function signalCategoryLabel(category: SignalCategory) {
  return (
    {
      quality: "质量",
      growth: "增长",
      profitability: "盈利",
      balance_sheet: "负债",
      cash_flow: "现金流",
      valuation: "估值",
      expectations: "预期",
      technical: "技术面",
      events: "事件",
      behavior: "行为"
    } satisfies Record<SignalCategory, string>
  )[category];
}

export function confidenceLabel(confidence: "low" | "medium" | "high") {
  return (
    {
      low: "低置信",
      medium: "中等置信",
      high: "高置信"
    } satisfies Record<"low" | "medium" | "high", string>
  )[confidence];
}

export function severityLabel(severity: Severity) {
  return (
    {
      low: "低",
      medium: "中",
      high: "高"
    } satisfies Record<Severity, string>
  )[severity];
}

export function evidenceSourceLabel(source: EvidenceSource) {
  return (
    {
      fmp_profile: "公司资料",
      fmp_quote: "行情",
      fmp_financial_statement: "财务报表",
      fmp_key_metrics: "关键指标",
      fmp_ratios: "财务比率",
      fmp_financial_scores: "财务健康分",
      fmp_owner_earnings: "所有者收益",
      fmp_enterprise_values: "企业价值",
      fmp_analyst_estimates: "分析师预期",
      fmp_price_target: "目标价",
      fmp_rating: "评级",
      fmp_news: "新闻",
      fmp_press_release: "公告",
      fmp_sec_filing: "SEC 文件",
      fmp_insider: "内幕交易",
      fmp_congress: "国会交易",
      fmp_technical: "技术面",
      fmp_peer: "同行",
      computed_signal: "计算信号"
    } satisfies Record<EvidenceSource, string>
  )[source];
}

export function dataModeLabel(mode: "mock" | "live" | "mixed") {
  return (
    {
      mock: "示例数据",
      live: "实时 FMP",
      mixed: "实时 + 缺口提示"
    } satisfies Record<"mock" | "live" | "mixed", string>
  )[mode];
}

export function thesisStatusLabel(status: "active" | "watching" | "closed") {
  return (
    {
      active: "进行中",
      watching: "观察中",
      closed: "已关闭"
    } satisfies Record<"active" | "watching" | "closed", string>
  )[status];
}

export function alertTypeLabel(type: string) {
  return (
    {
      quality_score: "基本面质量分",
      valuation_score: "估值分",
      expectations_score: "预期分",
      event_risk: "事件风险",
      price_move: "价格波动"
    } as Record<string, string>
  )[type] ?? type;
}

export function alertDirectionLabel(direction: string) {
  return (
    {
      above: "高于",
      below: "低于",
      any: "绝对波动"
    } as Record<string, string>
  )[direction] ?? direction;
}
