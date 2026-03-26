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

function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthPath(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const accessToken = request.cookies.get("kira_access_token")?.value;
  const hasValidAccessToken = looksLikeJwt(accessToken);
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !hasValidAccessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath(pathname) && hasValidAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
