import { NextResponse } from "next/server";
import {
  getSystemUniverseModel,
  getSystemUniversePage
} from "@/lib/server/system-universes";
import { getSystemUniverseDefinition } from "@/lib/universes";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedUniverse = params.get("universe");
  const definition = requestedUniverse
    ? getSystemUniverseDefinition(requestedUniverse)
    : undefined;

  if (definition) {
    const page = Number.parseInt(params.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(params.get("pageSize") ?? "50", 10);
    const model = await getSystemUniversePage(
      definition.id,
      Number.isFinite(page) ? page : 1,
      Number.isFinite(pageSize) ? pageSize : 50
    );

    return NextResponse.json(model);
  }

  const model = await getSystemUniverseModel();

  return NextResponse.json(model);
}
