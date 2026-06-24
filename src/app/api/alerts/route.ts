import { NextResponse } from "next/server";
import { alertInputSchema } from "@/lib/api-validation";
import { addAlertRule } from "@/lib/server/db";
import { getEvaluatedAlerts } from "@/lib/server/alerts";

export async function GET() {
  const alerts = await getEvaluatedAlerts();

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const parsed = alertInputSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "提醒规则格式不正确。" }, { status: 400 });
  }
  await addAlertRule({
    symbol: parsed.data.symbol,
    alertType: parsed.data.alertType,
    threshold: parsed.data.threshold,
    direction: parsed.data.direction,
    note: parsed.data.note
  });
  const alerts = await getEvaluatedAlerts();

  return NextResponse.json({ alerts });
}
