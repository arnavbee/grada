export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const ACCESS_TOKEN_STORAGE_KEY = "kira_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "kira_refresh_token";

function getCookieAttributes(maxAge: number, extraAttributes: string[] = []): string {
  const attributes = [`Path=/`, `Max-Age=${maxAge}`, `SameSite=Lax`, ...extraAttributes];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setAuthCookies(tokens: AuthTokens, rememberMe: boolean): void {
  const maxAge = rememberMe ? tokens.expires_in : 60 * 60;
  const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

  document.cookie = `kira_access_token=${encodeURIComponent(tokens.access_token)}; ${getCookieAttributes(maxAge)}`;
  document.cookie = `kira_refresh_token=${encodeURIComponent(tokens.refresh_token)}; ${getCookieAttributes(refreshMaxAge)}`;

  if (canUseStorage()) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.access_token);
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
  }
}

export function clearAuthCookies(): void {
  const clearCookieEverywhere = (name: string): void => {
    document.cookie = `${name}=; ${getCookieAttributes(0)}`;
    document.cookie = `${name}=; ${getCookieAttributes(0, ["Path=/dashboard"])}`;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host) {
        document.cookie = `${name}=; ${getCookieAttributes(0, [`Domain=${host}`])}`;
        if (host.includes(".")) {
          document.cookie = `${name}=; ${getCookieAttributes(0, [`Domain=.${host}`])}`;
        }
      }
    }
  };

  clearCookieEverywhere("kira_access_token");
  clearCookieEverywhere("kira_refresh_token");

  if (canUseStorage()) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function getStoredAccessToken(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return value?.trim() || null;
}

export function getStoredRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  return value?.trim() || null;
}
