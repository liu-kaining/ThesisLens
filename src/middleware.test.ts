import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/auth/session";
import { middleware } from "@/middleware";

describe("middleware authorization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not allow a viewer session to call internal APIs", async () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("INTERNAL_API_TOKEN", "i".repeat(32));
    const token = await createSessionToken("viewer", "viewer");
    const request = new NextRequest("http://localhost/api/internal/sync/run", {
      method: "POST",
      headers: {
        cookie: `thesislens_session=${token}`
      }
    });

    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it("allows the configured internal token to call internal APIs", async () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("INTERNAL_API_TOKEN", "i".repeat(32));
    const request = new NextRequest("http://localhost/api/internal/sync/run", {
      method: "POST",
      headers: {
        "x-internal-token": "i".repeat(32)
      }
    });

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows only whitelisted service reads outside the internal API namespace", async () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(32));
    vi.stubEnv("INTERNAL_API_TOKEN", "i".repeat(32));
    const allowed = new NextRequest("http://localhost/api/watchlist", {
      headers: { "x-internal-token": "i".repeat(32) }
    });
    const denied = new NextRequest("http://localhost/api/watchlist", {
      method: "POST",
      headers: { "x-internal-token": "i".repeat(32) }
    });

    expect((await middleware(allowed)).headers.get("x-middleware-next")).toBe("1");
    expect((await middleware(denied)).status).toBe(401);
  });
});
