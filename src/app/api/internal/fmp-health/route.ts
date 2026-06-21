import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/server/cache";
import { getFmpEndpointHealth } from "@/lib/server/fmp";

export async function GET() {
  const hasFmpKey = Boolean(process.env.FMP_API_KEY);
  const useMocks = process.env.FMP_USE_MOCKS !== "false" || !hasFmpKey;
  const cache = await getCacheStats();
  const endpoints = getFmpEndpointHealth();

  return NextResponse.json({
    ok: true,
    cache,
    fmp: {
      hasApiKey: hasFmpKey,
      mode: useMocks ? "mock" : "live",
      baseUrl: "https://financialmodelingprep.com/stable",
      premiumAssumptions: [
        "profile",
        "quote",
        "financial statements",
        "ratios and key metrics",
        "analyst estimates",
        "price targets",
        "news and press releases",
        "SEC filings",
        "insider trading",
        "senate and house trading"
      ],
      gatedOrNeedsValidation: [
        "13F institutional holdings",
        "ETF and mutual fund holdings",
        "earnings call transcripts",
        "1-minute intraday",
        "bulk and batch endpoints"
      ],
      endpointTelemetry: endpoints,
      summary: {
        checkedEndpoints: endpoints.length,
        failedEndpoints: endpoints.filter((endpoint) => !endpoint.ok).length,
        lastCheckedAt:
          endpoints
            .map((endpoint) => endpoint.lastCheckedAt)
            .sort()
            .at(-1) ?? null
      }
    },
    timestamp: new Date().toISOString()
  });
}
