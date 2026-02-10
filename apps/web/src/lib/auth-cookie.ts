export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export function setAuthCookies(tokens: AuthTokens, rememberMe: boolean): void {
  const maxAge = rememberMe ? tokens.expires_in : 60 * 60;
  const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

  document.cookie = `kira_access_token=${tokens.access_token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `kira_refresh_token=${tokens.refresh_token}; Path=/; Max-Age=${refreshMaxAge}; SameSite=Lax`;
}

export function clearAuthCookies(): void {
  document.cookie = "kira_access_token=; Path=/; Max-Age=0; SameSite=Lax";
  document.cookie = "kira_refresh_token=; Path=/; Max-Age=0; SameSite=Lax";
}
