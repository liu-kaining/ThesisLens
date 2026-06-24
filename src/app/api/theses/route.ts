import { NextResponse } from "next/server";
import { thesisInputSchema } from "@/lib/api-validation";
import { addSavedThesis, getSavedTheses } from "@/lib/server/db";

export async function GET() {
  const theses = await getSavedTheses();

  return NextResponse.json({ theses });
}

export async function POST(request: Request) {
  const parsed = thesisInputSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Thesis 内容格式不正确。" }, { status: 400 });
  }
  const theses = await addSavedThesis({
    symbol: parsed.data.symbol,
    title: parsed.data.title,
    thesisText: parsed.data.thesisText,
    status: parsed.data.status
  });

  return NextResponse.json({ theses });
}
