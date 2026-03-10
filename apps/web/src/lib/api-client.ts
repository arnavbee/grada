import { getResolvedApiBaseUrl } from '@/src/lib/api-url';

function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("kira_access_token="));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.split("=")[1] ?? "");
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const resolvedBase = getResolvedApiBaseUrl();
  const headers = new Headers(init?.headers ?? {});
  const hasFormDataBody =
    typeof FormData !== "undefined" && typeof init?.body !== "undefined" && init.body instanceof FormData;

  if (!headers.has("Content-Type") && !hasFormDataBody) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAccessTokenFromCookie();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
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
