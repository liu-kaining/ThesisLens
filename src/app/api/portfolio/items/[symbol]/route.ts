import { NextResponse } from "next/server";
import { deletePortfolioHolding } from "@/lib/server/db";
import { getPortfolioModel } from "@/lib/server/portfolio";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  await deletePortfolioHolding(symbol);
  const portfolio = await getPortfolioModel();

  return NextResponse.json(portfolio);
}

