import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/server/cache";
import { getDatabaseHealth } from "@/lib/server/db";

export async function GET() {
  const [database, cache] = await Promise.all([getDatabaseHealth(), getCacheStats()]);

  return NextResponse.json({
    ok: true,
    service: "thesislens",
    database,
    cache,
    timestamp: new Date().toISOString()
  });
}
