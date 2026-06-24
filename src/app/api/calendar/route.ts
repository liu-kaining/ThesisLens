import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/server/calendar";

export async function GET(request: Request) {
  const universeId = new URL(request.url).searchParams.get("universe");
  const calendar = await getCalendarEvents(undefined, universeId);

  return NextResponse.json(calendar);
}
