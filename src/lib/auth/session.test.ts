import { afterEach, describe, expect, it, vi } from "vitest";

describe("auth session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and verifies a signed admin session token", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");

    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken("admin", "admin");
    const session = await verifySessionToken(token);

    expect(session).toMatchObject({
      subject: "admin",
      role: "admin"
    });
  });

  it("rejects tampered tokens", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");

    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken("access-code", "viewer");
    const [payload, signature] = token.split(".");
    const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;
    const tampered = `${tamperedPayload}.${signature}`;

    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("caps viewer sessions to the requested access-code lifetime", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const now = Date.now();

    const { createSessionToken, verifySessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken("access-code:123", "viewer", now, 60);
    const session = await verifySessionToken(token);

    expect(session?.expiresAt).toBe(now + 60_000);
  });
});
