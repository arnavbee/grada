import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "../../middleware";

function buildRequest(pathname: string, cookieHeader?: string): NextRequest {
  return new NextRequest(`https://grada-web.vercel.app${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe("middleware auth validation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("redirects protected routes without a session token", async () => {
    const response = await middleware(buildRequest("/dashboard"));

    expect(response.headers.get("location")).toBe(
      "https://grada-web.vercel.app/login?next=%2Fdashboard",
    );
  });

  it("clears stale auth cookies instead of redirecting auth routes into the dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await middleware(
      buildRequest(
        "/login",
        "kira_access_token=header.payload.signature; kira_refresh_token=refresh.token.value",
      ),
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain("kira_access_token=;");
  });

  it("redirects auth routes to the dashboard only after the session validates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await middleware(
      buildRequest("/login", "kira_access_token=header.payload.signature"),
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe("https://grada-web.vercel.app/dashboard");
  });
});
