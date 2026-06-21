import { NextResponse } from "next/server";
import { addSavedThesis, getSavedTheses } from "@/lib/server/db";

export async function GET() {
  const theses = await getSavedTheses();

  return NextResponse.json({ theses });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    symbol?: string;
    title?: string;
    thesisText?: string;
    status?: "active" | "watching" | "closed";
  };
  const theses = await addSavedThesis({
    symbol: body.symbol ?? "",
    title: body.title ?? "",
    thesisText: body.thesisText ?? "",
    status: body.status
  });

  return NextResponse.json({ theses });
}

