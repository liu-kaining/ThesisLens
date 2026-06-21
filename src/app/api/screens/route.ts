import { NextResponse } from "next/server";
import { getResearchScreens } from "@/lib/server/screens";

export async function GET() {
  const screens = await getResearchScreens();

  return NextResponse.json({ screens });
}

