import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "../../app/api/v1/[...path]/route";

function buildRequest(): NextRequest {
  return new NextRequest("https://grada-web.vercel.app/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "content-type": "application/json" },
  });
}

describe("API proxy route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fails fast in production when the proxy target points at localhost", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");

    const response = await POST(buildRequest(), { params: { path: ["auth", "login"] } });
    const body = (await response.json()) as { detail?: string };

    expect(response.status).toBe(500);
    expect(body.detail).toContain("Set API_PROXY_TARGET or NEXT_PUBLIC_API_URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards requests to a public API target", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_PROXY_TARGET", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:8000");

    const response = await POST(buildRequest(), { params: { path: ["auth", "login"] } });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/api/v1/auth/login");
  });
});
