import { NextResponse } from "next/server";
import { getCompanyResearch } from "@/lib/server/research";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const research = await getCompanyResearch(symbol);

  return NextResponse.json(research);
}

