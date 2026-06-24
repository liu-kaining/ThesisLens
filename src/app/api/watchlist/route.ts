import { NextResponse } from "next/server";
import { watchlistInputSchema } from "@/lib/api-validation";
import { addWatchlistItem } from "@/lib/server/db";
import { getEnrichedWatchlist } from "@/lib/server/watchlist";

export async function GET() {
  const watchlist = await getEnrichedWatchlist();

  return NextResponse.json(watchlist);
}

export async function POST(request: Request) {
  const parsed = watchlistInputSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "股票代码或备注格式不正确。" }, { status: 400 });
  }

  const watchlist = await addWatchlistItem(parsed.data.symbol, parsed.data.notes);

  return NextResponse.json(watchlist);
}
