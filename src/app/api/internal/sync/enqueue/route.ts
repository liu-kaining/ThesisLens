import { NextResponse } from "next/server";
import { enqueueDueDataSync } from "@/lib/server/sync-queue";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    symbols?: string[];
    priority?: number;
    source?: string;
  };
  const symbols = Array.isArray(body.symbols) ? body.symbols.slice(0, 100) : [];
  const priority = Number.isFinite(body.priority)
    ? Math.max(0, Math.min(1000, Number(body.priority)))
    : 50;
  const result = await enqueueDueDataSync(
    symbols,
    priority,
    body.source?.slice(0, 80) || "internal"
  );

  return NextResponse.json({ ok: true, ...result });
}
