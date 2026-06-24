import { afterEach, describe, expect, it, vi } from "vitest";
import {
  claimDataSyncJobs,
  enqueueDataSyncJobs,
  finishDataSyncJobs
} from "@/lib/server/db";
import { enqueueDueDataSync } from "@/lib/server/sync-queue";

describe("module sync queue", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("plans missing modules and claims higher-priority jobs first", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");

    const planned = await enqueueDueDataSync(["ABCD"], 200, "test");
    const claimed = await claimDataSyncJobs(3);

    expect(planned.symbols).toBe(1);
    expect(planned.jobs).toBeGreaterThan(10);
    expect(claimed).toHaveLength(3);
    expect(claimed[0]?.symbol).toBe("ABCD");
    expect(claimed[0]?.priority).toBeGreaterThanOrEqual(claimed[1]?.priority ?? 0);

    await finishDataSyncJobs(claimed, { ok: true });
    expect(claimed.every((job) => job.status === "running")).toBe(true);
  });

  it("holds repeatedly failed jobs in a 24-hour cooldown after max attempts", async () => {
    vi.stubEnv("DATABASE_DISABLED", "true");
    vi.stubEnv("REDIS_DISABLED", "true");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T00:00:00Z"));
    const symbol = "COOL";

    await enqueueDataSyncJobs([
      { symbol, moduleKey: "quote", priority: 100, source: "test" }
    ]);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const claimed = await claimDataSyncJobs(100);
      const target = claimed.find((job) => job.symbol === symbol);
      expect(target?.attempts).toBe(attempt);
      await finishDataSyncJobs(
        claimed.filter((job) => job.symbol !== symbol),
        { ok: true }
      );
      await finishDataSyncJobs(target ? [target] : [], {
        ok: false,
        error: "test failure"
      });
      vi.advanceTimersByTime(Math.min(3600, 60 * 2 ** (attempt - 1)) * 1000);
    }

    await enqueueDataSyncJobs([
      { symbol, moduleKey: "quote", priority: 100, source: "test" }
    ]);
    const claimedDuringCooldown = await claimDataSyncJobs(100);

    expect(claimedDuringCooldown.some((job) => job.symbol === symbol)).toBe(false);
  });
});
