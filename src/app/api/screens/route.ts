import { NextResponse } from "next/server";
import { getResearchScreens } from "@/lib/server/screens";

export async function GET(request: Request) {
  const universeId = new URL(request.url).searchParams.get("universe");
  const model = await getResearchScreens(universeId);

  return NextResponse.json(model);
}
