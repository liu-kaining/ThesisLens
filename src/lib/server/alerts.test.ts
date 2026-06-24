import { describe, expect, it, vi } from "vitest";
import { addAlertRule } from "@/lib/server/db";
import { getEvaluatedAlerts } from "@/lib/server/alerts";

describe("alert evaluation", () => {
  it("evaluates memory fallback alert rules against current research values", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");
    await addAlertRule({
      symbol: "MSFT",
      alertType: "expectations_score",
      threshold: 70,
      direction: "above"
    });
    await addAlertRule({
      symbol: "NVDA",
      alertType: "valuation_score",
      threshold: 45,
      direction: "below"
    });

    const alerts = await getEvaluatedAlerts();

    expect(alerts.length).toBeGreaterThanOrEqual(2);
    for (const alert of alerts) {
      expect(alert.symbol).toMatch(/^[A-Z]+$/);
      expect(alert.currentValue).not.toBeNull();
      expect(typeof alert.triggered).toBe("boolean");
      expect(alert.explanation).toContain(alert.symbol);
      if (alert.threshold !== null && alert.enabled) {
        expect(["above", "below", "any"]).toContain(alert.direction);
      }
    }
  });
});
