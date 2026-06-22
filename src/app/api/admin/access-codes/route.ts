import { NextResponse } from "next/server";
import { createAccessCode, getAccessCodes } from "@/lib/server/db";
import { getCurrentSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const codes = await getAccessCodes();
  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { ttlHours?: number };
  const result = await createAccessCode({
    ttlHours: body.ttlHours,
    createdBy: session.subject
  });

  return NextResponse.json(result);
}
