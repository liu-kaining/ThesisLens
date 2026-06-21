import { NextResponse } from "next/server";
import { getMarketModel } from "@/lib/server/market";

export async function GET() {
  const market = await getMarketModel();

  return NextResponse.json(market);
}

