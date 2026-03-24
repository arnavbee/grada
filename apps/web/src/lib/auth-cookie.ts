export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

function getCookieAttributes(maxAge: number): string {
  const attributes = [`Path=/`, `Max-Age=${maxAge}`, `SameSite=Lax`];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

export function setAuthCookies(tokens: AuthTokens, rememberMe: boolean): void {
  const maxAge = rememberMe ? tokens.expires_in : 60 * 60;
  const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

  document.cookie = `kira_access_token=${tokens.access_token}; ${getCookieAttributes(maxAge)}`;
  document.cookie = `kira_refresh_token=${tokens.refresh_token}; ${getCookieAttributes(refreshMaxAge)}`;
}

export function clearAuthCookies(): void {
  document.cookie = `kira_access_token=; ${getCookieAttributes(0)}`;
  document.cookie = `kira_refresh_token=; ${getCookieAttributes(0)}`;
}
