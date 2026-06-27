import { NextResponse } from "next/server";
import { syncAllSystemUniverses } from "@/lib/server/system-universes";

export async function POST() {
  const result = await syncAllSystemUniverses();

  return NextResponse.json(result);
}
