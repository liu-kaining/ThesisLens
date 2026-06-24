import { NextResponse } from "next/server";
import { portfolioInputSchema } from "@/lib/api-validation";
import { upsertPortfolioHolding } from "@/lib/server/db";
import { getPortfolioModel } from "@/lib/server/portfolio";

export async function GET() {
  const portfolio = await getPortfolioModel();

  return NextResponse.json(portfolio);
}

export async function POST(request: Request) {
  const parsed = portfolioInputSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "持仓数据格式不正确。" }, { status: 400 });
  }

  await upsertPortfolioHolding({
    symbol: parsed.data.symbol,
    shares: parsed.data.shares,
    averageCost: parsed.data.averageCost,
    notes: parsed.data.notes
  });
  const portfolio = await getPortfolioModel();

  return NextResponse.json(portfolio);
}
