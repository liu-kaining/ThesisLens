import { existsSync, readFileSync } from "fs";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const envFile = readEnvFile();
const adminPassphrase = process.env.ADMIN_PASSPHRASE ?? process.env.ADMIN_PASSWORD ?? envFile.ADMIN_PASSPHRASE ?? envFile.ADMIN_PASSWORD;

const checks = [
  {
    name: "health",
    path: "/api/health",
    expect: ["\"ok\":true", "\"service\":\"thesislens\""]
  },
  {
    name: "dashboard",
    path: "/",
    expect: ["ThesisLens", "观察列表变化", "研究候选"]
  },
  {
    name: "admin page",
    path: "/admin",
    expect: ["管理员视角", "动态访问口令", "重建口令"]
  },
  {
    name: "search api",
    path: "/api/search?q=tesla",
    expect: ["\"symbol\":\"TSLA\"", "\"Tesla, Inc.\""]
  },
  {
    name: "company page",
    path: "/stocks/AAPL",
    expect: ["Apple Inc.", "核心数据快照", "客观数据摘要", "证据账本"]
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
    expect: ["\"items\""]
  },
  {
    name: "universes page",
    path: "/universes",
    expect: ["系统研究池", "S&amp;P 500", "QQQ 持仓", "用于选股"]
  },
  {
    name: "universes api",
    path: "/api/universes",
    expect: ["\"universes\"", "\"membersByUniverse\"", "\"sp500\"", "\"qqq_holdings\""]
  },
  {
    name: "paginated universe page",
    path: "/universes?universe=sp500&page=2",
    expect: ["S&amp;P 500", "显示 <!-- -->51", "<!-- -->100", "研究池分页"]
  },
  {
    name: "paginated universe api",
    path: "/api/universes?universe=sp500&page=2&pageSize=50",
    expect: ["\"selectedUniverse\"", "\"pagination\"", "\"page\":2", "\"pageSize\":50"]
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
    expect: ["\"events\"", "\"universe\""]
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

const cookieHeader = await login();

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const response = await fetch(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined
  });
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

async function login() {
  if (!adminPassphrase) {
    throw new Error("Smoke auth failed: ADMIN_PASSPHRASE is required.");
  }

  const response = await fetch(new URL("/api/auth/login", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      passphrase: adminPassphrase,
      next: "/"
    })
  });
  if (!response.ok) {
    throw new Error(`Smoke auth failed with HTTP ${response.status}`);
  }

  const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
  const cookies = getSetCookie ? getSetCookie() : [response.headers.get("set-cookie")].filter(Boolean);
  const header = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
  if (!header.includes("thesislens_session=")) {
    throw new Error("Smoke auth failed: session cookie was not returned.");
  }
  console.log("ok - auth login");
  return header;
}

function readEnvFile() {
  if (!existsSync(".env")) return {};
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}
