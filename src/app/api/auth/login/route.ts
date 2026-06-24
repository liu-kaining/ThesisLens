import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
  verifyAdminPassphrase
} from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/server/cache";
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
  const rateLimitKey = `auth:login:${clientIdentifier(request)}`;
  const rateLimit = await consumeRateLimit(rateLimitKey, 10, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "登录尝试过多，请稍后再试。" },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) }
      }
    );
  }
  const passphrase = body.passphrase ?? body.password ?? "";
  const admin = verifyAdminPassphrase(passphrase);
  let accessCode = null;
  if (!admin) {
    try {
      accessCode = await verifyAccessCode(passphrase);
    } catch {
      return NextResponse.json(
        { error: "访问口令服务暂不可用，请稍后重试。" },
        { status: 503 }
      );
    }
  }

  if (!admin && !accessCode) {
    return NextResponse.json({ error: "口令不正确或已经过期。" }, { status: 401 });
  }

  const role = admin ? "admin" : "viewer";
  const viewerMaxAgeSeconds = accessCode
    ? Math.max(
        1,
        Math.floor((new Date(accessCode.expiresAt).getTime() - Date.now()) / 1000)
      )
    : SESSION_MAX_AGE_SECONDS;
  const sessionMaxAgeSeconds = admin
    ? SESSION_MAX_AGE_SECONDS
    : Math.min(SESSION_MAX_AGE_SECONDS, viewerMaxAgeSeconds);
  const token = await createSessionToken(
    admin ? "admin" : `access-code:${accessCode?.id}`,
    role,
    Date.now(),
    sessionMaxAgeSeconds
  );
  await resetRateLimit(rateLimitKey);
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
    maxAge: sessionMaxAgeSeconds
  });

  return response;
}

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwarded ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  ).slice(0, 80);
}

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/")) return "/";
  return value;
}

function shouldUseSecureCookies() {
  return process.env.AUTH_SECURE_COOKIES === "true" || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true;
}
