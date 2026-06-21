import { NextResponse } from "next/server";
import { addAlertRule, type AlertRuleRecord } from "@/lib/server/db";
import { getEvaluatedAlerts } from "@/lib/server/alerts";

export async function GET() {
  const alerts = await getEvaluatedAlerts();

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    symbol?: string;
    alertType?: AlertRuleRecord["alertType"];
    threshold?: number | null;
    direction?: AlertRuleRecord["direction"];
    note?: string;
  };
  await addAlertRule({
    symbol: body.symbol ?? "",
    alertType: body.alertType ?? "quality_score",
    threshold: body.threshold === undefined || body.threshold === null ? null : Number(body.threshold),
    direction: body.direction ?? "above",
    note: body.note
  });
  const alerts = await getEvaluatedAlerts();

  return NextResponse.json({ alerts });
}

