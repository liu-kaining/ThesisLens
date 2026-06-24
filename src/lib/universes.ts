export type SystemUniverseId =
  | "sp500"
  | "nasdaq"
  | "dowjones"
  | "spy_holdings"
  | "qqq_holdings";

export type ResearchUniverseId = "watchlist" | SystemUniverseId;

export type SystemUniverseDefinition = {
  id: SystemUniverseId;
  name: string;
  description: string;
  sourceType: "index_constituents" | "etf_holdings";
  sourceSymbol?: string;
  priority: number;
};

export const SYSTEM_UNIVERSES: SystemUniverseDefinition[] = [
  {
    id: "sp500",
    name: "S&P 500",
    description: "FMP S&P 500 成分股，用作美股大盘核心研究池。",
    sourceType: "index_constituents",
    priority: 10
  },
  {
    id: "qqq_holdings",
    name: "QQQ 持仓",
    description: "Invesco QQQ 持仓，用作 Nasdaq 100 投资权重池近似。",
    sourceType: "etf_holdings",
    sourceSymbol: "QQQ",
    priority: 20
  },
  {
    id: "spy_holdings",
    name: "SPY 持仓",
    description: "SPDR S&P 500 ETF 持仓，用作标普权重池近似。",
    sourceType: "etf_holdings",
    sourceSymbol: "SPY",
    priority: 30
  },
  {
    id: "dowjones",
    name: "道琼斯工业指数",
    description: "FMP Dow Jones 成分股，用作蓝筹核心池。",
    sourceType: "index_constituents",
    priority: 40
  },
  {
    id: "nasdaq",
    name: "Nasdaq 成分股",
    description: "FMP Nasdaq 成分列表，用作 Nasdaq 广义研究池。",
    sourceType: "index_constituents",
    priority: 50
  }
];

export function getSystemUniverseDefinition(id: string) {
  return SYSTEM_UNIVERSES.find((universe) => universe.id === id);
}

export function normalizeResearchUniverseId(value?: string | null): ResearchUniverseId {
  if (value === "watchlist") return value;
  return getSystemUniverseDefinition(value ?? "")?.id ?? "watchlist";
}

export const RESEARCH_UNIVERSE_OPTIONS: Array<{
  id: ResearchUniverseId;
  name: string;
  shortName: string;
}> = [
  { id: "watchlist", name: "我的观察列表", shortName: "观察列表" },
  ...SYSTEM_UNIVERSES.map((universe) => ({
    id: universe.id,
    name: universe.name,
    shortName:
      universe.id === "qqq_holdings"
        ? "QQQ"
        : universe.id === "spy_holdings"
          ? "SPY"
          : universe.name
  }))
];
