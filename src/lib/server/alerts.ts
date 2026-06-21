import { getAlertRules } from "@/lib/server/db";
import { getCompanyResearch } from "@/lib/server/research";

export type EvaluatedAlert = {
  id: string;
  symbol: string;
  alertType: string;
  threshold?: number | null;
  direction: string;
  note?: string | null;
  enabled: boolean;
  currentValue: number | null;
  triggered: boolean;
  explanation: string;
};

export async function getEvaluatedAlerts(): Promise<EvaluatedAlert[]> {
  const rules = await getAlertRules();

  return Promise.all(
    rules.map(async (rule) => {
      const research = await getCompanyResearch(rule.symbol);
      const scoreByType = (type: string) =>
        research.scores.find((score) => score.scoreType === type)?.score ?? null;
      const currentValue =
        rule.alertType === "quality_score"
          ? scoreByType("quality")
          : rule.alertType === "valuation_score"
            ? scoreByType("valuation")
            : rule.alertType === "expectations_score"
              ? scoreByType("expectations")
              : rule.alertType === "event_risk"
                ? 100 - (scoreByType("events") ?? 50)
                : research.snapshot.quote.changesPercentage;
      const threshold = rule.threshold ?? null;
      const triggered =
        rule.enabled &&
        threshold !== null &&
        currentValue !== null &&
        (rule.direction === "above"
          ? currentValue >= threshold
          : rule.direction === "below"
            ? currentValue <= threshold
            : Math.abs(currentValue) >= Math.abs(threshold));

      return {
        id: rule.id,
        symbol: rule.symbol,
        alertType: rule.alertType,
        threshold,
        direction: rule.direction,
        note: rule.note,
        enabled: rule.enabled,
        currentValue,
        triggered,
        explanation: triggered
          ? `${rule.symbol} currently meets the ${rule.alertType} alert condition.`
          : `${rule.symbol} has not crossed the configured ${rule.alertType} threshold.`
      };
    })
  );
}

