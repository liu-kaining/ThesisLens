import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyInternalToken, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout", "/api/health"]);
const INTERNAL_SERVICE_READ_PATHS = new Set(["/api/watchlist", "/api/universes"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/internal/")) {
    if (verifyInternalToken(request.headers.get("x-internal-token"))) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    request.method === "GET" &&
    INTERNAL_SERVICE_READ_PATHS.has(pathname) &&
    verifyInternalToken(request.headers.get("x-internal-token"))
  ) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (session) {
    if (isAdminPath(pathname) && session.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    /\.(?:png|jpg|jpeg|gif|webp|ico|svg|css|js|txt|map)$/.test(pathname)
  );
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname === "/settings" || pathname.startsWith("/api/admin/");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
