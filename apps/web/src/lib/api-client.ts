import { getResolvedApiBaseUrl } from "@/src/lib/api-url";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthCookies,
  type AuthTokens,
} from "@/src/lib/auth-cookie";

let refreshTokenRequestInFlight: Promise<string | null> | null = null;

function looksLikeJwt(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) return null;
  let token = value.trim();
  if (!token) return null;
  if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice("bearer ".length).trim();
  }
  if (!token || token === "undefined" || token === "null") return null;
  return token;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const matches = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(prefix));

  if (matches.length === 0) {
    return null;
  }

  // Prefer JWT-like values first when duplicate cookies exist.
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const entry = matches[idx];
    if (!entry) continue;
    const rawValue = entry.slice(prefix.length);
    if (!rawValue) continue;
    try {
      const decoded = decodeURIComponent(rawValue);
      const normalized = normalizeToken(decoded);
      if (normalized && looksLikeJwt(normalized)) return normalized;
    } catch {
      continue;
    }
  }

  // Fallback: return any non-empty normalized value.
  for (let idx = matches.length - 1; idx >= 0; idx -= 1) {
    const entry = matches[idx];
    if (!entry) continue;
    const rawValue = entry.slice(prefix.length);
    if (!rawValue) continue;
    try {
      const decoded = decodeURIComponent(rawValue);
      const normalized = normalizeToken(decoded);
      if (normalized) return normalized;
    } catch {
      continue;
    }
  }

  return null;
}

function getAccessTokenFromCookie(): string | null {
  return getCookieValue("kira_access_token") ?? normalizeToken(getStoredAccessToken());
}

function getRefreshTokenFromCookie(): string | null {
  return getCookieValue("kira_refresh_token") ?? normalizeToken(getStoredRefreshToken());
}

async function refreshAccessToken(baseUrl: string): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) {
    return null;
  }

  if (!refreshTokenRequestInFlight) {
    refreshTokenRequestInFlight = (async () => {
      try {
        const response = await fetch(`${baseUrl}/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
          cache: "no-store",
        });
        if (!response.ok) {
          return null;
        }
        const tokens = (await response.json()) as AuthTokens;
        setAuthCookies(tokens, true);
        return tokens.access_token;
      } catch {
        return null;
      } finally {
        refreshTokenRequestInFlight = null;
      }
    })();
  }

  return refreshTokenRequestInFlight;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const resolvedBase = getResolvedApiBaseUrl();
  const hasFormDataBody =
    typeof FormData !== "undefined" &&
    typeof init?.body !== "undefined" &&
    init.body instanceof FormData;

  const applyHeaders = async (): Promise<Headers> => {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has("Content-Type") && !hasFormDataBody) {
      headers.set("Content-Type", "application/json");
    }

    if (!headers.has("Authorization")) {
      let accessToken = getAccessTokenFromCookie();
      if (!accessToken) {
        accessToken = await refreshAccessToken(resolvedBase);
      }
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
        if (!headers.has("X-Access-Token")) {
          headers.set("X-Access-Token", accessToken);
        }
      }
    }

    return headers;
  };

  let response: Response;
  try {
    const headers = await applyHeaders();
    response = await fetch(`${resolvedBase}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (err) {
    console.error("API Request Error:", err);
    throw new Error(
      `Cannot reach API at ${resolvedBase}. Verify NEXT_PUBLIC_API_URL and that the API server is running.`,
    );
  }

  if (response.status === 401) {
    const refreshedAccessToken = await refreshAccessToken(resolvedBase);
    if (refreshedAccessToken) {
      const retryHeaders = new Headers(init?.headers ?? {});
      if (!retryHeaders.has("Content-Type") && !hasFormDataBody) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${refreshedAccessToken}`);
      if (!retryHeaders.has("X-Access-Token")) {
        retryHeaders.set("X-Access-Token", refreshedAccessToken);
      }
      response = await fetch(`${resolvedBase}${path}`, {
        ...init,
        headers: retryHeaders,
        cache: "no-store",
      });
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string; message?: string };
      message = body.detail ?? body.message ?? message;
    } catch {
      // Ignore body parse errors and fallback to generic message.
    }
    throw new Error(message);
  }

  // Handle 204 No Content responses (DELETE endpoints)
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
