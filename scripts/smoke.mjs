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
    expect: ["Apple Inc.", "Today Conclusion", "AI Investment Memo", "Evidence Ledger"]
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
    expect: ["\"screens\"", "High Quality Companies"]
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
    expect: ["Portfolio", "Understand exposure", "Add Holding"]
  },
  {
    name: "portfolio api",
    path: "/api/portfolio",
    expect: ["\"holdings\"", "\"totalValue\""]
  },
  {
    name: "theses page",
    path: "/theses",
    expect: ["Thesis Tracker", "Track what must remain true", "Save Thesis"]
  },
  {
    name: "theses api",
    path: "/api/theses",
    expect: ["\"theses\"", "\"symbol\""]
  },
  {
    name: "alerts page",
    path: "/alerts",
    expect: ["Alerts", "Create Alert Rule", "Evaluated Alerts"]
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
