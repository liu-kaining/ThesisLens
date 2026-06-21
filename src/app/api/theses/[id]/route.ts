import { NextResponse } from "next/server";
import { deleteSavedThesis } from "@/lib/server/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theses = await deleteSavedThesis(id);

  return NextResponse.json({ theses });
}

