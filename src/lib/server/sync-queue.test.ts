import { afterEach, describe, expect, it, vi } from "vitest";
import { claimDataSyncJobs, finishDataSyncJobs } from "@/lib/server/db";
import { enqueueDueDataSync } from "@/lib/server/sync-queue";

describe("module sync queue", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
