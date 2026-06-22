import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("access code store", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DATABASE_DISABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a time-limited access code and revokes the previous active code on rebuild", async () => {
    const { createAccessCode, verifyAccessCode } = await import("@/lib/server/db");

    const first = await createAccessCode({ ttlHours: 1, createdBy: "admin" });
    expect(first.code).toBeTruthy();
    expect(first.record.active).toBe(true);
    expect(await verifyAccessCode(first.code)).toMatchObject({ id: first.record.id, active: true });

    const second = await createAccessCode({ ttlHours: 1, createdBy: "admin" });
    expect(await verifyAccessCode(first.code)).toBeNull();
    expect(await verifyAccessCode(second.code)).toMatchObject({ id: second.record.id, active: true });
  });
});
