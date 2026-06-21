import { describe, expect, it, vi } from "vitest";
import { getCompanyResearch, refreshCompanyResearch } from "@/lib/server/research";

describe("research service", () => {
  it("returns a complete mock-backed research model without external services", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");

    const research = await refreshCompanyResearch("NVDA");

    expect(research.snapshot.profile.symbol).toBe("NVDA");
    expect(research.snapshot.dataStatus.mode).toBe("mock");
    expect(research.evidence.length).toBeGreaterThan(12);
    expect(research.scores).toHaveLength(10);
    expect(research.signals).toHaveLength(6);
    expect(research.memo.symbol).toBe("NVDA");
    expect(research.memo.model).toBe("rules");
  });

  it("normalizes unknown tickers into the fallback research shape", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.stubEnv("FMP_USE_MOCKS", "true");

    const research = await getCompanyResearch("abcx");

    expect(research.snapshot.profile.symbol).toBe("ABCX");
    expect(research.snapshot.profile.name).toContain("ABCX");
    expect(research.snapshot.dataStatus.warnings.join(" ")).toContain("ABCX");
  });
});
