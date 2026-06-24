export type DataModuleKey =
  | "profile"
  | "quote"
  | "fundamentals"
  | "financial_scores"
  | "valuation"
  | "expectations"
  | "news"
  | "sec"
  | "insider"
  | "congress"
  | "technical"
  | "peers"
  | "calendar";

export type DataModuleDefinition = {
  key: DataModuleKey;
  label: string;
  ttlSeconds: number;
  priority: number;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const DATA_MODULES: DataModuleDefinition[] = [
  { key: "quote", label: "行情", ttlSeconds: 5 * MINUTE, priority: 100 },
  { key: "news", label: "新闻与公告", ttlSeconds: 15 * MINUTE, priority: 90 },
  { key: "sec", label: "SEC 文件", ttlSeconds: 30 * MINUTE, priority: 88 },
  { key: "technical", label: "技术面", ttlSeconds: HOUR, priority: 80 },
  { key: "insider", label: "内幕交易", ttlSeconds: 3 * HOUR, priority: 76 },
  { key: "expectations", label: "分析师预期", ttlSeconds: 6 * HOUR, priority: 74 },
  { key: "calendar", label: "财报日历", ttlSeconds: 6 * HOUR, priority: 72 },
  { key: "valuation", label: "估值与目标价", ttlSeconds: 12 * HOUR, priority: 70 },
  { key: "congress", label: "国会交易", ttlSeconds: 12 * HOUR, priority: 68 },
  { key: "fundamentals", label: "财务报表与比率", ttlSeconds: DAY, priority: 64 },
  { key: "financial_scores", label: "财务健康分", ttlSeconds: DAY, priority: 62 },
  { key: "profile", label: "公司资料", ttlSeconds: 7 * DAY, priority: 50 },
  { key: "peers", label: "同行公司", ttlSeconds: 7 * DAY, priority: 45 }
];

const DATA_MODULE_MAP = new Map(DATA_MODULES.map((module) => [module.key, module]));

export function getDataModuleDefinition(key: DataModuleKey) {
  return DATA_MODULE_MAP.get(key) as DataModuleDefinition;
}

export function isDataModuleKey(value: string): value is DataModuleKey {
  return DATA_MODULE_MAP.has(value as DataModuleKey);
}

export function moduleExpiresAt(key: DataModuleKey, refreshedAt: string) {
  const refreshedTime = new Date(refreshedAt).getTime();
  return new Date(refreshedTime + getDataModuleDefinition(key).ttlSeconds * 1000).toISOString();
}

export function allDataModuleKeys() {
  return DATA_MODULES.map((module) => module.key);
}
