const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const checks = [
  {
    name: "health",
    path: "/api/health",
    expect: ["\"ok\":true", "\"service\":\"thesislens\""]
  },
  {
    name: "dashboard",
    path: "/",
    expect: ["ThesisLens", "Watchlist Changes", "Research Candidates"]
  },
  {
    name: "company page",
    path: "/stocks/AAPL",
    expect: ["Apple Inc.", "今日结论", "规则研究备忘录", "证据账本"]
  },
  {
    name: "company snapshot api",
    path: "/api/stocks/AAPL/snapshot",
    expect: ["\"snapshot\"", "\"evidence\"", "\"signals\"", "\"memo\""]
  },
  {
    name: "fundamentals api",
    path: "/api/stocks/AAPL/fundamentals",
    expect: ["\"financials\"", "\"metrics\"", "\"financialScores\""]
  },
  {
    name: "valuation api",
    path: "/api/stocks/AAPL/valuation",
    expect: ["\"valuation\"", "\"priceTarget\"", "\"peers\""]
  },
  {
    name: "expectations api",
    path: "/api/stocks/AAPL/expectations",
    expect: ["\"analystEstimates\"", "\"rating\"", "\"priceTarget\""]
  },
  {
    name: "events api",
    path: "/api/stocks/AAPL/events",
    expect: ["\"upcomingEvents\"", "\"news\"", "\"filings\""]
  },
  {
    name: "behavior api",
    path: "/api/stocks/AAPL/behavior",
    expect: ["\"insiders\"", "\"congress\"", "\"disclaimer\""]
  },
  {
    name: "watchlist api",
    path: "/api/watchlist",
    expect: ["\"items\"", "\"symbol\"", "\"changeBadges\""]
  },
  {
    name: "screens api",
    path: "/api/screens",
    expect: ["\"screens\"", "高质量公司"]
  },
  {
    name: "market api",
    path: "/api/market",
    expect: ["\"companies\"", "\"sectors\""]
  },
  {
    name: "calendar api",
    path: "/api/calendar",
    expect: ["\"events\"", "\"symbol\""]
  },
  {
    name: "portfolio page",
    path: "/portfolio",
    expect: ["组合", "用 thesis 质量", "添加持仓"]
  },
  {
    name: "portfolio api",
    path: "/api/portfolio",
    expect: ["\"holdings\"", "\"totalValue\""]
  },
  {
    name: "theses page",
    path: "/theses",
    expect: ["Thesis 跟踪", "跟踪必须继续成立", "保存 Thesis"]
  },
  {
    name: "theses api",
    path: "/api/theses",
    expect: ["\"theses\"", "\"symbol\""]
  },
  {
    name: "alerts page",
    path: "/alerts",
    expect: ["提醒", "创建提醒规则", "已评估提醒"]
  },
  {
    name: "alerts api",
    path: "/api/alerts",
    expect: ["\"alerts\"", "\"triggered\""]
  }
];

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${check.name} failed with HTTP ${response.status}`);
  }
  const text = await response.text();
  const missing = check.expect.filter((needle) => !text.includes(needle));
  if (missing.length > 0) {
    throw new Error(`${check.name} missing expected content: ${missing.join(", ")}`);
  }
  console.log(`ok - ${check.name}`);
}

console.log(`Smoke tests passed against ${baseUrl}`);
