import { NextResponse } from "next/server";
import { getSearchResults } from "@/lib/server/research";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const results = await getSearchResults(query);

  return NextResponse.json({ results });
}

