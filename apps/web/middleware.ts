import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const authCookieNames = ["kira_access_token", "kira_refresh_token"] as const;

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

async function hasActiveSession(request: NextRequest, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(new URL("/api/v1/auth/me", request.url), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Access-Token": accessToken,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

function clearAuthCookies(response: NextResponse): NextResponse {
  for (const cookieName of authCookieNames) {
    response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("kira_access_token")?.value;
  const normalizedAccessToken = normalizeToken(accessToken);
  const hasTokenCandidate = looksLikeJwt(accessToken);
  const hasValidSession =
    hasTokenCandidate && normalizedAccessToken
      ? await hasActiveSession(request, normalizedAccessToken)
      : false;

  if (isProtectedPath(pathname) && !hasValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return clearAuthCookies(NextResponse.redirect(loginUrl));
  }

  if (isAuthPath(pathname) && hasTokenCandidate && !hasValidSession) {
    return clearAuthCookies(NextResponse.next());
  }

  if (isAuthPath(pathname) && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
