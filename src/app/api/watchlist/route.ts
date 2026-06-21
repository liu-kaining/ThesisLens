import { NextResponse } from "next/server";
import { addWatchlistItem } from "@/lib/server/db";
import { getEnrichedWatchlist } from "@/lib/server/watchlist";

export async function GET() {
  const watchlist = await getEnrichedWatchlist();

  return NextResponse.json(watchlist);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    symbol?: string;
    notes?: string;
  };

  const watchlist = await addWatchlistItem(body.symbol ?? "", body.notes);

  return NextResponse.json(watchlist);
}
