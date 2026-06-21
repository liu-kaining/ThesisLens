import { NextResponse } from "next/server";
import { upsertPortfolioHolding } from "@/lib/server/db";
import { getPortfolioModel } from "@/lib/server/portfolio";

export async function GET() {
  const portfolio = await getPortfolioModel();

  return NextResponse.json(portfolio);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    symbol?: string;
    shares?: number;
    averageCost?: number | null;
    notes?: string;
  };

  await upsertPortfolioHolding({
    symbol: body.symbol ?? "",
    shares: Number(body.shares),
    averageCost:
      body.averageCost === undefined || body.averageCost === null ? null : Number(body.averageCost),
    notes: body.notes
  });
  const portfolio = await getPortfolioModel();

  return NextResponse.json(portfolio);
}

