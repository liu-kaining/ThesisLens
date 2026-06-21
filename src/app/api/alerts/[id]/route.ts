import { NextResponse } from "next/server";
import { deleteAlertRule } from "@/lib/server/db";
import { getEvaluatedAlerts } from "@/lib/server/alerts";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteAlertRule(id);
  const alerts = await getEvaluatedAlerts();

  return NextResponse.json({ alerts });
}

