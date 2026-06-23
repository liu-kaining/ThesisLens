export type Direction = "positive" | "negative" | "neutral" | "mixed";
export type Severity = "low" | "medium" | "high";

export type CompanyProfile = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  website?: string;
  ceo?: string;
  image?: string;
  description: string;
  marketCap?: number;
  beta?: number;
  ipoDate?: string;
  employees?: number;
};

export type Quote = {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  volume: number;
  marketCap: number;
  yearHigh?: number;
  yearLow?: number;
  avgVolume?: number;
  pe?: number;
  eps?: number;
  timestamp: string;
};

export type FinancialPoint = {
  fiscalYear: number;
  period: "FY" | "Q1" | "Q2" | "Q3" | "Q4" | "TTM";
  revenue: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome: number;
  eps?: number;
  freeCashFlow: number;
  operatingCashFlow?: number;
  capitalExpenditure?: number;
  totalAssets?: number;
  totalDebt?: number;
  cashAndEquivalents?: number;
  sharesOutstanding?: number;
};

export type MetricPoint = {
  fiscalYear: number;
  period: "FY" | "TTM";
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
  roic?: number;
  currentRatio?: number;
  debtToEquity?: number;
  peRatio?: number;
  priceToSalesRatio?: number;
  priceToBookRatio?: number;
  evToEbitda?: number;
  fcfYield?: number;
};

export type FinancialScores = {
  piotroskiScore?: number;
  altmanZScore?: number;
  workingCapital?: number;
  totalAssets?: number;
  retainedEarnings?: number;
  ebit?: number;
};

export type AnalystEstimate = {
  fiscalYear: number;
  estimatedRevenueAvg?: number;
  estimatedEpsAvg?: number;
  revenueRevisionPercent?: number;
  epsRevisionPercent?: number;
  analysts?: number;
};

export type RatingSnapshot = {
  rating: string;
  overallScore?: number;
  discountedCashFlowScore?: number;
  returnOnEquityScore?: number;
  returnOnAssetsScore?: number;
  debtToEquityScore?: number;
  priceToEarningsScore?: number;
  priceToBookScore?: number;
};

export type PriceTarget = {
  targetHigh?: number;
  targetLow?: number;
  targetConsensus?: number;
  targetMedian?: number;
  updatedAt?: string;
};

export type Valuation = {
  dcf?: number;
  leveredDcf?: number;
  enterpriseValue?: number;
  marketCap?: number;
  historicalPePercentile?: number;
  peerPePercentile?: number;
  sectorPe?: number;
  industryPe?: number;
};

export type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  url?: string;
  summary: string;
  sentiment?: Direction;
};

export type SecFiling = {
  id: string;
  formType: string;
  filingDate: string;
  acceptedDate?: string;
  title: string;
  url?: string;
};

export type InsiderTransaction = {
  id: string;
  reportingName: string;
  role?: string;
  transactionType: string;
  transactionDate: string;
  filingDate?: string;
  shares?: number;
  price?: number;
  value?: number;
  ownershipType?: string;
  formType?: string;
  securityName?: string;
  sourceUrl?: string;
};

export type CongressionalTransaction = {
  id: string;
  chamber: "Senate" | "House";
  representativeName: string;
  party?: string;
  state?: string;
  transactionType: string;
  transactionDate: string;
  filingDate?: string;
  amountMin?: number;
  amountMax?: number;
  amountLabel?: string;
  assetDescription?: string;
  owner?: string;
  office?: string;
  sourceUrl?: string;
};

export type TechnicalPoint = {
  date: string;
  close: number;
  volume?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
};

export type PeerSnapshot = {
  symbol: string;
  name: string;
  marketCap?: number;
  revenueGrowth?: number;
  operatingMargin?: number;
  peRatio?: number;
  evToEbitda?: number;
  fcfYield?: number;
  priceChange1Y?: number;
};

export type UpcomingEvent = {
  id: string;
  type: "earnings" | "dividend" | "split" | "ipo" | "macro" | "custom";
  date: string;
  title: string;
  description?: string;
  severity: Severity;
};

export type SearchResult = {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
};

export type EvidenceSource =
  | "fmp_profile"
  | "fmp_quote"
  | "fmp_financial_statement"
  | "fmp_key_metrics"
  | "fmp_ratios"
  | "fmp_financial_scores"
  | "fmp_owner_earnings"
  | "fmp_enterprise_values"
  | "fmp_analyst_estimates"
  | "fmp_price_target"
  | "fmp_rating"
  | "fmp_news"
  | "fmp_press_release"
  | "fmp_sec_filing"
  | "fmp_insider"
  | "fmp_congress"
  | "fmp_technical"
  | "fmp_peer"
  | "computed_signal";

export type Evidence = {
  id: string;
  symbol: string;
  source: EvidenceSource;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  period?: string;
  timestamp?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export type SignalCategory =
  | "quality"
  | "growth"
  | "profitability"
  | "balance_sheet"
  | "cash_flow"
  | "valuation"
  | "expectations"
  | "technical"
  | "events"
  | "behavior";

export type Signal = {
  id: string;
  symbol: string;
  category: SignalCategory;
  direction: Direction;
  severity: Severity;
  confidence: number;
  title: string;
  summary: string;
  evidenceIds: string[];
  computedAt: string;
};

export type CompanyScore = {
  id: string;
  symbol: string;
  scoreType:
    | "quality"
    | "growth"
    | "profitability"
    | "balance_sheet"
    | "cash_flow"
    | "valuation"
    | "expectations"
    | "technical"
    | "events"
    | "behavior";
  score: number;
  label: "strong" | "good" | "mixed" | "weak";
  drivers: Array<{
    label: string;
    direction: Direction;
    value: string;
  }>;
  evidenceIds: string[];
  computedAt: string;
};

export type MemoSection = {
  summary: string;
  evidenceIds: string[];
  confidence: "low" | "medium" | "high";
};

export type ResearchMemo = {
  symbol: string;
  generatedAt: string;
  factsHash: string;
  executiveSummary: string;
  whatChanged: MemoSection;
  businessQuality: MemoSection;
  valuation: MemoSection;
  expectations: MemoSection;
  catalystsAndRisks: MemoSection;
  behaviorSignals: MemoSection;
  bullCase: MemoSection;
  bearCase: MemoSection;
  keyQuestions: string[];
  evidenceIds: string[];
  model: "rules";
};

export type ResearchSnapshot = {
  profile: CompanyProfile;
  quote: Quote;
  financials: FinancialPoint[];
  metrics: MetricPoint[];
  scores: FinancialScores;
  analystEstimates: AnalystEstimate[];
  rating: RatingSnapshot;
  priceTarget: PriceTarget;
  valuation: Valuation;
  news: NewsItem[];
  filings: SecFiling[];
  insiders: InsiderTransaction[];
  congress: CongressionalTransaction[];
  technicals: TechnicalPoint[];
  peers: PeerSnapshot[];
  upcomingEvents: UpcomingEvent[];
  dataStatus: {
    mode: "mock" | "live" | "mixed";
    refreshedAt: string;
    warnings: string[];
    modules?: Array<{
      key: string;
      label: string;
      status: "live" | "unavailable" | "mock";
      detail: string;
    }>;
  };
};

export type EnrichedResearch = {
  snapshot: ResearchSnapshot;
  evidence: Evidence[];
  signals: Signal[];
  scores: CompanyScore[];
  memo: ResearchMemo;
};

export type DashboardModel = {
  generatedAt: string;
  universe: {
    source: "watchlist";
    symbols: string[];
    count: number;
    isEmpty: boolean;
  };
  marketPulse: Array<{
    label: string;
    value: string;
    direction: Direction;
    detail: string;
  }>;
  watchlist: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    topSignal: string;
    score: number;
  }>;
  researchIdeas: Array<{
    symbol: string;
    title: string;
    thesis: string;
    direction: Direction;
  }>;
};
