import { describe, expect, it, vi } from "vitest";
import { buildResearchMemo } from "@/lib/research-memo";
import { getMockSnapshot } from "@/lib/mock-data";
import { buildEvidence, computeScores, computeSignals } from "@/lib/signals";

describe("research memo builder", () => {
  it("creates a rules-based evidence-backed memo without external model calls", async () => {
    const snapshot = getMockSnapshot("MSFT");
    const evidence = buildEvidence(snapshot);
    const scores = computeScores(snapshot, evidence);
    const signals = computeSignals(snapshot, scores, evidence);
    const memo = await buildResearchMemo(snapshot, scores, signals, evidence);
    const evidenceIds = new Set(evidence.map((item) => item.id));

    expect(memo.symbol).toBe("MSFT");
    expect(memo.model).toBe("rules");
    expect(memo.executiveSummary).toContain("Microsoft");
    expect(memo.executiveSummary).toContain("不是买卖建议");
    expect(memo.factsHash).toMatch(/^[a-f0-9]{16}$/);
    expect(memo.keyQuestions).toHaveLength(5);
    expect(memo.evidenceIds.length).toBeGreaterThan(8);
    expect(memo.evidenceIds.every((id) => evidenceIds.has(id))).toBe(true);
    expect(memo.businessQuality.evidenceIds.length).toBeGreaterThan(0);
    expect(memo.valuation.evidenceIds.length).toBeGreaterThan(0);
    expect(memo.expectations.evidenceIds.length).toBeGreaterThan(0);
  });
});
