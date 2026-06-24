import { describe, expect, it } from "vitest";
import {
  alertInputSchema,
  portfolioInputSchema,
  stockSymbolSchema,
  thesisInputSchema
} from "@/lib/api-validation";

describe("API validation", () => {
  it("normalizes valid U.S. stock symbols and rejects malformed values", () => {
    expect(stockSymbolSchema.parse(" brk.b ")).toBe("BRK.B");
    expect(stockSymbolSchema.safeParse("../AAPL").success).toBe(false);
  });

  it("rejects invalid portfolio and research inputs", () => {
    expect(
      portfolioInputSchema.safeParse({ symbol: "AAPL", shares: -1 }).success
    ).toBe(false);
    expect(
      thesisInputSchema.safeParse({
        symbol: "AAPL",
        title: "",
        thesisText: "Evidence"
      }).success
    ).toBe(false);
    expect(
      alertInputSchema.safeParse({
        symbol: "AAPL",
        alertType: "unknown",
        direction: "above"
      }).success
    ).toBe(false);
  });
});
