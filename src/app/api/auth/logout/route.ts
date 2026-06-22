import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("cache-control", "no-store");
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0
  });
  return response;
}

function shouldUseSecureCookies() {
  return process.env.AUTH_SECURE_COOKIES === "true" || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}
