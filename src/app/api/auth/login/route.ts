import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
  verifyAdminPassphrase
} from "@/lib/auth/session";
import { verifyAccessCode } from "@/lib/server/db";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "管理员口令未配置，请先设置 ADMIN_PASSPHRASE 和 AUTH_SECRET。" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    passphrase?: string;
    password?: string;
    next?: string;
  };
  const passphrase = body.passphrase ?? body.password ?? "";
  const admin = verifyAdminPassphrase(passphrase);
  const accessCode = admin ? null : await verifyAccessCode(passphrase);

  if (!admin && !accessCode) {
    return NextResponse.json({ error: "口令不正确或已经过期。" }, { status: 401 });
  }

  const role = admin ? "admin" : "viewer";
  const token = await createSessionToken(admin ? "admin" : `access-code:${accessCode?.id}`, role);
  const response = NextResponse.json({
    ok: true,
    role,
    next: safeNextPath(body.next)
  });
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return response;
}

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/")) return "/";
  return value;
}

function shouldUseSecureCookies() {
  return process.env.AUTH_SECURE_COOKIES === "true" || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}
