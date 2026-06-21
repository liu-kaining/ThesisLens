import type { ResearchSnapshot, SearchResult } from "@/lib/types";

const refreshedAt = new Date().toISOString();

export const mockSnapshots: Record<string, ResearchSnapshot> = {
  AAPL: {
    profile: {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "US",
      currency: "USD",
      website: "https://www.apple.com",
      ceo: "Tim Cook",
      description:
        "Apple designs smartphones, personal computers, tablets, wearables, services, and an integrated software ecosystem for consumers and enterprises.",
      marketCap: 2980000000000,
      beta: 1.2,
      ipoDate: "1980-12-12",
      employees: 164000
    },
    quote: {
      symbol: "AAPL",
      price: 196.45,
      change: 2.14,
      changesPercentage: 1.1,
      volume: 52400000,
      avgVolume: 58600000,
      marketCap: 2980000000000,
      yearHigh: 237.49,
      yearLow: 164.08,
      pe: 30.7,
      eps: 6.4,
      timestamp: refreshedAt
    },
    financials: [
      {
        fiscalYear: 2025,
        period: "FY",
        revenue: 402100000000,
        grossProfit: 185600000000,
        operatingIncome: 127900000000,
        netIncome: 101400000000,
        eps: 6.4,
        freeCashFlow: 108200000000,
        operatingCashFlow: 122900000000,
        capitalExpenditure: -14700000000,
        totalAssets: 364900000000,
        totalDebt: 104600000000,
        cashAndEquivalents: 67100000000,
        sharesOutstanding: 15180000000
      },
      {
        fiscalYear: 2024,
        period: "FY",
        revenue: 391000000000,
        grossProfit: 180700000000,
        operatingIncome: 123200000000,
        netIncome: 93700000000,
        eps: 6.08,
        freeCashFlow: 99500000000,
        operatingCashFlow: 118300000000,
        capitalExpenditure: -18800000000,
        totalAssets: 352600000000,
        totalDebt: 108000000000,
        cashAndEquivalents: 62000000000,
        sharesOutstanding: 15420000000
      },
      {
        fiscalYear: 2023,
        period: "FY",
        revenue: 383300000000,
        grossProfit: 169100000000,
        operatingIncome: 114300000000,
        netIncome: 97000000000,
        eps: 6.13,
        freeCashFlow: 99580000000,
        operatingCashFlow: 110500000000,
        capitalExpenditure: -10900000000,
        totalAssets: 352800000000,
        totalDebt: 111100000000,
        cashAndEquivalents: 61500000000,
        sharesOutstanding: 15810000000
      },
      {
        fiscalYear: 2022,
        period: "FY",
        revenue: 394300000000,
        grossProfit: 170800000000,
        operatingIncome: 119400000000,
        netIncome: 99800000000,
        eps: 6.11,
        freeCashFlow: 111400000000,
        operatingCashFlow: 122100000000,
        capitalExpenditure: -10700000000,
        totalAssets: 352700000000,
        totalDebt: 120100000000,
        cashAndEquivalents: 48300000000,
        sharesOutstanding: 16330000000
      }
    ],
    metrics: [
      {
        fiscalYear: 2025,
        period: "FY",
        grossMargin: 46.2,
        operatingMargin: 31.8,
        netMargin: 25.2,
        roe: 145,
        roic: 54,
        currentRatio: 1.05,
        debtToEquity: 1.63,
        peRatio: 30.7,
        priceToSalesRatio: 7.4,
        priceToBookRatio: 45.2,
        evToEbitda: 22.8,
        fcfYield: 3.6
      },
      {
        fiscalYear: 2024,
        period: "FY",
        grossMargin: 46.2,
        operatingMargin: 31.5,
        netMargin: 24.0,
        roe: 151,
        roic: 51,
        currentRatio: 0.97,
        debtToEquity: 1.79,
        peRatio: 31.9,
        priceToSalesRatio: 7.2,
        priceToBookRatio: 42.8,
        evToEbitda: 23.4,
        fcfYield: 3.4
      }
    ],
    scores: {
      piotroskiScore: 8,
      altmanZScore: 7.1
    },
    analystEstimates: [
      {
        fiscalYear: 2026,
        estimatedRevenueAvg: 421000000000,
        estimatedEpsAvg: 7.08,
        revenueRevisionPercent: 2.4,
        epsRevisionPercent: 3.1,
        analysts: 34
      },
      {
        fiscalYear: 2025,
        estimatedRevenueAvg: 402100000000,
        estimatedEpsAvg: 6.4,
        revenueRevisionPercent: 1.1,
        epsRevisionPercent: 0.8,
        analysts: 36
      }
    ],
    rating: {
      rating: "Buy",
      overallScore: 4.1,
      discountedCashFlowScore: 3.2,
      returnOnEquityScore: 5,
      returnOnAssetsScore: 4.3,
      debtToEquityScore: 2.7,
      priceToEarningsScore: 3
    },
    priceTarget: {
      targetHigh: 260,
      targetLow: 170,
      targetConsensus: 225,
      targetMedian: 220,
      updatedAt: refreshedAt
    },
    valuation: {
      dcf: 184,
      leveredDcf: 191,
      enterpriseValue: 3030000000000,
      marketCap: 2980000000000,
      historicalPePercentile: 74,
      peerPePercentile: 66,
      sectorPe: 31,
      industryPe: 28
    },
    news: [
      {
        id: "aapl-news-1",
        title: "Apple services revenue reaches a new annual high",
        publisher: "FMP Mock Wire",
        publishedAt: refreshedAt,
        summary:
          "Services growth offset modest hardware cyclicality, keeping gross margin near record levels.",
        sentiment: "positive"
      },
      {
        id: "aapl-news-2",
        title: "Regulatory scrutiny remains a margin watch item",
        publisher: "FMP Mock Wire",
        publishedAt: "2026-06-18T14:30:00.000Z",
        summary:
          "App store rules and platform fees remain under review in major markets.",
        sentiment: "negative"
      }
    ],
    filings: [
      {
        id: "aapl-8k-1",
        formType: "8-K",
        filingDate: "2026-06-17",
        title: "Current report: board authorization and capital return update"
      },
      {
        id: "aapl-10q-1",
        formType: "10-Q",
        filingDate: "2026-05-02",
        title: "Quarterly report"
      }
    ],
    insiders: [
      {
        id: "aapl-insider-1",
        reportingName: "Luca Maestri",
        role: "Senior executive",
        transactionType: "Sale",
        transactionDate: "2026-06-10",
        filingDate: "2026-06-12",
        shares: 12000,
        price: 192.4,
        value: 2308800,
        ownershipType: "Direct"
      }
    ],
    congress: [
      {
        id: "aapl-congress-1",
        chamber: "House",
        representativeName: "Sample Representative",
        party: "D",
        state: "CA",
        transactionType: "Purchase",
        transactionDate: "2026-05-28",
        filingDate: "2026-06-13",
        amountMin: 15001,
        amountMax: 50000,
        assetDescription: "Apple Inc. common stock"
      }
    ],
    technicals: [
      { date: "2026-06-14", close: 189.1, volume: 51000000, sma50: 188.2, sma200: 191.4, rsi: 52 },
      { date: "2026-06-15", close: 190.8, volume: 49800000, sma50: 188.5, sma200: 191.2, rsi: 54 },
      { date: "2026-06-16", close: 191.4, volume: 53700000, sma50: 188.9, sma200: 191.0, rsi: 55 },
      { date: "2026-06-17", close: 193.5, volume: 62200000, sma50: 189.3, sma200: 190.9, rsi: 58 },
      { date: "2026-06-18", close: 194.3, volume: 50400000, sma50: 189.8, sma200: 190.8, rsi: 59 },
      { date: "2026-06-19", close: 196.45, volume: 52400000, sma50: 190.1, sma200: 190.7, rsi: 62 }
    ],
    peers: [
      {
        symbol: "MSFT",
        name: "Microsoft",
        marketCap: 3500000000000,
        revenueGrowth: 14.2,
        operatingMargin: 44.6,
        peRatio: 35.8,
        evToEbitda: 24.5,
        fcfYield: 2.8,
        priceChange1Y: 22.4
      },
      {
        symbol: "GOOGL",
        name: "Alphabet",
        marketCap: 2200000000000,
        revenueGrowth: 12.1,
        operatingMargin: 32.4,
        peRatio: 24.1,
        evToEbitda: 17.2,
        fcfYield: 4.5,
        priceChange1Y: 18.7
      }
    ],
    upcomingEvents: [
      {
        id: "aapl-event-1",
        type: "earnings",
        date: "2026-07-31",
        title: "Fiscal Q3 earnings window",
        description: "Consensus will focus on services growth and hardware replacement cycle.",
        severity: "medium"
      }
    ],
    dataStatus: {
      mode: "mock",
      refreshedAt,
      warnings: ["Using bundled demo data. Add FMP_API_KEY and set FMP_USE_MOCKS=false for live data."]
    }
  },
  MSFT: {
    profile: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Software - Infrastructure",
      country: "US",
      currency: "USD",
      website: "https://www.microsoft.com",
      ceo: "Satya Nadella",
      description:
        "Microsoft provides cloud, productivity, operating system, gaming, AI infrastructure, and enterprise software platforms globally.",
      marketCap: 3500000000000,
      beta: 0.9,
      ipoDate: "1986-03-13",
      employees: 228000
    },
    quote: {
      symbol: "MSFT",
      price: 471.2,
      change: 4.38,
      changesPercentage: 0.94,
      volume: 22600000,
      avgVolume: 24200000,
      marketCap: 3500000000000,
      yearHigh: 486.3,
      yearLow: 371.2,
      pe: 35.8,
      eps: 13.16,
      timestamp: refreshedAt
    },
    financials: [
      {
        fiscalYear: 2025,
        period: "FY",
        revenue: 278500000000,
        grossProfit: 193200000000,
        operatingIncome: 124100000000,
        netIncome: 98700000000,
        eps: 13.16,
        freeCashFlow: 80800000000,
        operatingCashFlow: 119600000000,
        capitalExpenditure: -38800000000,
        totalAssets: 536000000000,
        totalDebt: 97800000000,
        cashAndEquivalents: 91200000000,
        sharesOutstanding: 7430000000
      },
      {
        fiscalYear: 2024,
        period: "FY",
        revenue: 245100000000,
        grossProfit: 171000000000,
        operatingIncome: 109400000000,
        netIncome: 88100000000,
        eps: 11.8,
        freeCashFlow: 74200000000,
        operatingCashFlow: 118500000000,
        capitalExpenditure: -44300000000,
        totalAssets: 512000000000,
        totalDebt: 96200000000,
        cashAndEquivalents: 75500000000,
        sharesOutstanding: 7460000000
      },
      {
        fiscalYear: 2023,
        period: "FY",
        revenue: 211900000000,
        grossProfit: 146000000000,
        operatingIncome: 88500000000,
        netIncome: 72300000000,
        eps: 9.68,
        freeCashFlow: 59400000000,
        operatingCashFlow: 87500000000,
        capitalExpenditure: -28100000000,
        totalAssets: 411900000000,
        totalDebt: 59900000000,
        cashAndEquivalents: 111300000000,
        sharesOutstanding: 7470000000
      }
    ],
    metrics: [
      {
        fiscalYear: 2025,
        period: "FY",
        grossMargin: 69.4,
        operatingMargin: 44.6,
        netMargin: 35.4,
        roe: 36.8,
        roic: 28.5,
        currentRatio: 1.27,
        debtToEquity: 0.42,
        peRatio: 35.8,
        priceToSalesRatio: 12.6,
        priceToBookRatio: 12.9,
        evToEbitda: 24.5,
        fcfYield: 2.3
      }
    ],
    scores: {
      piotroskiScore: 8,
      altmanZScore: 8.3
    },
    analystEstimates: [
      {
        fiscalYear: 2026,
        estimatedRevenueAvg: 318000000000,
        estimatedEpsAvg: 15.25,
        revenueRevisionPercent: 4.9,
        epsRevisionPercent: 5.7,
        analysts: 42
      }
    ],
    rating: {
      rating: "Strong Buy",
      overallScore: 4.6,
      discountedCashFlowScore: 3.4,
      returnOnEquityScore: 4.8,
      returnOnAssetsScore: 4.6,
      debtToEquityScore: 4.2,
      priceToEarningsScore: 2.8
    },
    priceTarget: {
      targetHigh: 560,
      targetLow: 410,
      targetConsensus: 515,
      targetMedian: 510,
      updatedAt: refreshedAt
    },
    valuation: {
      dcf: 438,
      leveredDcf: 452,
      enterpriseValue: 3560000000000,
      marketCap: 3500000000000,
      historicalPePercentile: 82,
      peerPePercentile: 71,
      sectorPe: 31,
      industryPe: 34
    },
    news: [
      {
        id: "msft-news-1",
        title: "Cloud and AI infrastructure backlog expands",
        publisher: "FMP Mock Wire",
        publishedAt: refreshedAt,
        summary:
          "Investors are watching whether AI capex converts into durable Azure revenue acceleration.",
        sentiment: "positive"
      }
    ],
    filings: [
      {
        id: "msft-10q-1",
        formType: "10-Q",
        filingDate: "2026-04-25",
        title: "Quarterly report"
      }
    ],
    insiders: [
      {
        id: "msft-insider-1",
        reportingName: "Amy Hood",
        role: "Chief Financial Officer",
        transactionType: "Sale",
        transactionDate: "2026-06-08",
        filingDate: "2026-06-10",
        shares: 7000,
        price: 462,
        value: 3234000,
        ownershipType: "Direct"
      }
    ],
    congress: [],
    technicals: [
      { date: "2026-06-14", close: 456.4, volume: 21000000, sma50: 448, sma200: 421, rsi: 58 },
      { date: "2026-06-15", close: 459.1, volume: 21900000, sma50: 449, sma200: 422, rsi: 60 },
      { date: "2026-06-16", close: 461.7, volume: 23500000, sma50: 450, sma200: 423, rsi: 61 },
      { date: "2026-06-17", close: 466.8, volume: 24100000, sma50: 451, sma200: 424, rsi: 64 },
      { date: "2026-06-18", close: 468.2, volume: 22400000, sma50: 452, sma200: 425, rsi: 65 },
      { date: "2026-06-19", close: 471.2, volume: 22600000, sma50: 453, sma200: 426, rsi: 66 }
    ],
    peers: [
      {
        symbol: "GOOGL",
        name: "Alphabet",
        marketCap: 2200000000000,
        revenueGrowth: 12.1,
        operatingMargin: 32.4,
        peRatio: 24.1,
        evToEbitda: 17.2,
        fcfYield: 4.5,
        priceChange1Y: 18.7
      },
      {
        symbol: "ORCL",
        name: "Oracle",
        marketCap: 410000000000,
        revenueGrowth: 8.4,
        operatingMargin: 33.1,
        peRatio: 27.9,
        evToEbitda: 18.9,
        fcfYield: 3.1,
        priceChange1Y: 31.5
      }
    ],
    upcomingEvents: [
      {
        id: "msft-event-1",
        type: "earnings",
        date: "2026-07-29",
        title: "Fiscal Q4 earnings window",
        description: "Focus areas: Azure growth, AI capex, operating leverage.",
        severity: "high"
      }
    ],
    dataStatus: {
      mode: "mock",
      refreshedAt,
      warnings: ["Using bundled demo data. Add FMP_API_KEY and set FMP_USE_MOCKS=false for live data."]
    }
  },
  NVDA: {
    profile: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      exchange: "NASDAQ",
      sector: "Technology",
      industry: "Semiconductors",
      country: "US",
      currency: "USD",
      website: "https://www.nvidia.com",
      ceo: "Jensen Huang",
      description:
        "NVIDIA designs GPUs, accelerated computing platforms, AI infrastructure, networking systems, and software ecosystems for data center, gaming, and professional visualization markets.",
      marketCap: 4100000000000,
      beta: 1.7,
      ipoDate: "1999-01-22",
      employees: 36500
    },
    quote: {
      symbol: "NVDA",
      price: 168.34,
      change: -1.91,
      changesPercentage: -1.12,
      volume: 189000000,
      avgVolume: 213000000,
      marketCap: 4100000000000,
      yearHigh: 180.2,
      yearLow: 94.5,
      pe: 46.2,
      eps: 3.64,
      timestamp: refreshedAt
    },
    financials: [
      {
        fiscalYear: 2026,
        period: "FY",
        revenue: 182000000000,
        grossProfit: 136800000000,
        operatingIncome: 112600000000,
        netIncome: 98600000000,
        eps: 3.64,
        freeCashFlow: 88600000000,
        operatingCashFlow: 101200000000,
        capitalExpenditure: -12600000000,
        totalAssets: 146000000000,
        totalDebt: 11200000000,
        cashAndEquivalents: 51200000000,
        sharesOutstanding: 24400000000
      },
      {
        fiscalYear: 2025,
        period: "FY",
        revenue: 130500000000,
        grossProfit: 97800000000,
        operatingIncome: 81400000000,
        netIncome: 72800000000,
        eps: 2.92,
        freeCashFlow: 64200000000,
        operatingCashFlow: 73100000000,
        capitalExpenditure: -8900000000,
        totalAssets: 111000000000,
        totalDebt: 10800000000,
        cashAndEquivalents: 38500000000,
        sharesOutstanding: 24900000000
      }
    ],
    metrics: [
      {
        fiscalYear: 2026,
        period: "FY",
        grossMargin: 75.2,
        operatingMargin: 61.9,
        netMargin: 54.2,
        roe: 82.1,
        roic: 67.4,
        currentRatio: 4.2,
        debtToEquity: 0.13,
        peRatio: 46.2,
        priceToSalesRatio: 22.5,
        priceToBookRatio: 32.1,
        evToEbitda: 38.6,
        fcfYield: 2.2
      }
    ],
    scores: {
      piotroskiScore: 9,
      altmanZScore: 21.4
    },
    analystEstimates: [
      {
        fiscalYear: 2027,
        estimatedRevenueAvg: 224000000000,
        estimatedEpsAvg: 4.85,
        revenueRevisionPercent: 8.8,
        epsRevisionPercent: 11.4,
        analysts: 48
      }
    ],
    rating: {
      rating: "Strong Buy",
      overallScore: 4.7,
      discountedCashFlowScore: 2.8,
      returnOnEquityScore: 5,
      returnOnAssetsScore: 5,
      debtToEquityScore: 5,
      priceToEarningsScore: 2.2
    },
    priceTarget: {
      targetHigh: 220,
      targetLow: 125,
      targetConsensus: 188,
      targetMedian: 186,
      updatedAt: refreshedAt
    },
    valuation: {
      dcf: 142,
      leveredDcf: 151,
      enterpriseValue: 4060000000000,
      marketCap: 4100000000000,
      historicalPePercentile: 68,
      peerPePercentile: 79,
      sectorPe: 31,
      industryPe: 39
    },
    news: [
      {
        id: "nvda-news-1",
        title: "AI accelerator demand remains supply constrained",
        publisher: "FMP Mock Wire",
        publishedAt: refreshedAt,
        summary:
          "Data center demand continues to exceed supply, but valuation leaves little room for execution missteps.",
        sentiment: "mixed"
      }
    ],
    filings: [
      {
        id: "nvda-10q-1",
        formType: "10-Q",
        filingDate: "2026-05-29",
        title: "Quarterly report"
      }
    ],
    insiders: [
      {
        id: "nvda-insider-1",
        reportingName: "Jensen Huang",
        role: "Chief Executive Officer",
        transactionType: "Sale",
        transactionDate: "2026-06-12",
        filingDate: "2026-06-14",
        shares: 50000,
        price: 170.1,
        value: 8505000,
        ownershipType: "Indirect"
      }
    ],
    congress: [
      {
        id: "nvda-congress-1",
        chamber: "Senate",
        representativeName: "Sample Senator",
        party: "R",
        state: "TX",
        transactionType: "Sale",
        transactionDate: "2026-06-01",
        filingDate: "2026-06-16",
        amountMin: 50001,
        amountMax: 100000,
        assetDescription: "NVIDIA Corporation common stock"
      }
    ],
    technicals: [
      { date: "2026-06-14", close: 162.2, volume: 203000000, sma50: 154, sma200: 129, rsi: 68 },
      { date: "2026-06-15", close: 166.7, volume: 221000000, sma50: 155, sma200: 130, rsi: 72 },
      { date: "2026-06-16", close: 172.4, volume: 244000000, sma50: 156, sma200: 131, rsi: 76 },
      { date: "2026-06-17", close: 170.9, volume: 218000000, sma50: 157, sma200: 132, rsi: 73 },
      { date: "2026-06-18", close: 170.25, volume: 196000000, sma50: 158, sma200: 133, rsi: 70 },
      { date: "2026-06-19", close: 168.34, volume: 189000000, sma50: 159, sma200: 134, rsi: 67 }
    ],
    peers: [
      {
        symbol: "AMD",
        name: "Advanced Micro Devices",
        marketCap: 260000000000,
        revenueGrowth: 21.3,
        operatingMargin: 16.8,
        peRatio: 43.4,
        evToEbitda: 31.6,
        fcfYield: 1.7,
        priceChange1Y: 12.2
      },
      {
        symbol: "AVGO",
        name: "Broadcom",
        marketCap: 1600000000000,
        revenueGrowth: 29.1,
        operatingMargin: 46.2,
        peRatio: 38.2,
        evToEbitda: 25.8,
        fcfYield: 2.6,
        priceChange1Y: 44.5
      }
    ],
    upcomingEvents: [
      {
        id: "nvda-event-1",
        type: "earnings",
        date: "2026-08-26",
        title: "Fiscal Q2 earnings window",
        description: "Key questions: supply expansion, hyperscaler capex, export restrictions.",
        severity: "high"
      }
    ],
    dataStatus: {
      mode: "mock",
      refreshedAt,
      warnings: ["Using bundled demo data. Add FMP_API_KEY and set FMP_USE_MOCKS=false for live data."]
    }
  }
};

export const mockSearchResults: SearchResult[] = Object.values(mockSnapshots).map((snapshot) => ({
  symbol: snapshot.profile.symbol,
  name: snapshot.profile.name,
  exchange: snapshot.profile.exchange,
  sector: snapshot.profile.sector,
  industry: snapshot.profile.industry,
  marketCap: snapshot.profile.marketCap
}));

export function getMockSnapshot(symbol: string) {
  const normalized = symbol.toUpperCase();
  const existing = mockSnapshots[normalized];
  if (existing) return existing;

  const fallback = JSON.parse(JSON.stringify(mockSnapshots.AAPL)) as ResearchSnapshot;
  fallback.profile.symbol = normalized;
  fallback.profile.name = `${normalized} Demo Research`;
  fallback.profile.description =
    "Demo fallback company generated from the Apple sample model. Add FMP_API_KEY and set FMP_USE_MOCKS=false for live company-specific data.";
  fallback.quote.symbol = normalized;
  fallback.dataStatus = {
    ...fallback.dataStatus,
    warnings: [
      `No bundled mock snapshot exists for ${normalized}; using a demo fallback shape.`,
      "Add FMP_API_KEY and set FMP_USE_MOCKS=false for live company-specific data."
    ]
  };
  return fallback;
}
