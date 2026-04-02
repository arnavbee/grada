import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

function normalizeToken(raw: string | undefined): string {
  if (!raw) return "";
  let token = raw.trim();
  if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice("bearer ".length).trim();
  }
  return token;
}

function looksLikeJwt(raw: string | undefined): boolean {
  const token = normalizeToken(raw);
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padLength)}`;
  return atob(padded);
}

function getJwtExpMs(raw: string | undefined): number | null {
  const token = normalizeToken(raw);
  if (!looksLikeJwt(token)) {
    return null;
  }
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    return null;
  }
  try {
    const payload = JSON.parse(decodeBase64Url(payloadSegment)) as { exp?: number };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function hasActiveJwt(raw: string | undefined): boolean {
  if (!looksLikeJwt(raw)) {
    return false;
  }
  const expMs = getJwtExpMs(raw);
  if (!expMs) {
    return true;
  }
  const nowMs = Date.now();
  const graceWindowMs = 30_000;
  return expMs > nowMs + graceWindowMs;
}

function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthPath(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("kira_access_token")?.value;
  const refreshToken = request.cookies.get("kira_refresh_token")?.value;
  const hasValidSession = hasActiveJwt(accessToken) || hasActiveJwt(refreshToken);

  if (isProtectedPath(pathname) && !hasValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath(pathname) && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
