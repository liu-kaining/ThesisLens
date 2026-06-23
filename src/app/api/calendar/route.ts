import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/server/calendar";

export async function GET() {
  const calendar = await getCalendarEvents();

  return NextResponse.json(calendar);
}
