import { NextResponse } from "next/server";
import { removeWatchlistItem } from "@/lib/server/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const watchlist = await removeWatchlistItem(symbol);

  return NextResponse.json(watchlist);
}

