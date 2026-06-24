import { NextResponse } from "next/server";
import { getMarketModel } from "@/lib/server/market";

export async function GET(request: Request) {
  const universeId = new URL(request.url).searchParams.get("universe");
  const market = await getMarketModel(undefined, universeId);

  return NextResponse.json(market);
}
