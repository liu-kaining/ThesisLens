import { describe, expect, it } from "vitest";
import { getMockSnapshot } from "@/lib/mock-data";
import { buildEvidence, computeScores, computeSignals } from "@/lib/signals";

describe("research signal engine", () => {
  it("builds evidence-backed scores and signals from an FMP-shaped snapshot", () => {
    const snapshot = getMockSnapshot("AAPL");
    const evidence = buildEvidence(snapshot);
    const scores = computeScores(snapshot, evidence);
    const signals = computeSignals(snapshot, scores, evidence);
    const evidenceIds = new Set(evidence.map((item) => item.id));

    expect(evidence.length).toBeGreaterThanOrEqual(16);
    expect(scores.map((score) => score.scoreType)).toEqual([
      "quality",
      "growth",
      "profitability",
      "balance_sheet",
      "cash_flow",
      "valuation",
      "expectations",
      "technical",
      "events",
      "behavior"
    ]);
    expect(signals.map((signal) => signal.category)).toEqual([
      "quality",
      "valuation",
      "expectations",
      "events",
      "behavior",
      "technical"
    ]);

    for (const score of scores) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.evidenceIds.length).toBeGreaterThan(0);
      expect(new Set(score.evidenceIds).size).toBe(score.evidenceIds.length);
      expect(score.evidenceIds.every((id) => evidenceIds.has(id))).toBe(true);
    }

    for (const signal of signals) {
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
      expect(signal.evidenceIds.length).toBeGreaterThan(0);
      expect(new Set(signal.evidenceIds).size).toBe(signal.evidenceIds.length);
      expect(signal.evidenceIds.every((id) => evidenceIds.has(id))).toBe(true);
    }
  });

  it("does not manufacture analytical scores when the underlying evidence is missing", () => {
    const base = getMockSnapshot("AAPL");
    const snapshot = {
      ...base,
      profile: { ...base.profile, symbol: "QQQ", name: "Invesco QQQ Trust" },
      financials: [],
      metrics: [],
      scores: {},
      analystEstimates: [],
      rating: { rating: "" },
      priceTarget: {},
      valuation: {},
      insiders: [],
      congress: [],
      technicals: []
    };
    const evidence = buildEvidence(snapshot);
    const scores = computeScores(snapshot, evidence);
    const signals = computeSignals(snapshot, scores, evidence);

    expect(scores.map((score) => score.scoreType)).not.toContain("quality");
    expect(scores.map((score) => score.scoreType)).not.toContain("valuation");
    expect(scores.map((score) => score.scoreType)).not.toContain("expectations");
    expect(scores.map((score) => score.scoreType)).not.toContain("technical");
    expect(scores.map((score) => score.scoreType)).not.toContain("behavior");
    expect(signals.map((signal) => signal.category)).not.toContain("quality");
    expect(signals.map((signal) => signal.category)).not.toContain("valuation");
  });
});
