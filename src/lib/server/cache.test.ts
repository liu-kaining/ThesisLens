import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeRateLimit, resetRateLimit } from "@/lib/server/cache";

describe("rate limit cache", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks attempts beyond the configured in-memory limit and can reset", async () => {
    vi.stubEnv("REDIS_DISABLED", "true");
    const key = `test-rate-limit-${Date.now()}`;

    expect((await consumeRateLimit(key, 2, 60)).allowed).toBe(true);
    expect((await consumeRateLimit(key, 2, 60)).allowed).toBe(true);
    expect((await consumeRateLimit(key, 2, 60)).allowed).toBe(false);

    await resetRateLimit(key);
    expect((await consumeRateLimit(key, 2, 60)).allowed).toBe(true);
  });
});
