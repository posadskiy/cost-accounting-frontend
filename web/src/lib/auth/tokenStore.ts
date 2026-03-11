/**
 * Access token store with cookie persistence for middleware-based route protection.
 * Token is kept in memory for API calls and mirrored in a cookie so that:
 * - Next.js middleware can read the cookie to enforce route protection
 * - Full page reloads rehydrate from the cookie
 */

import { AUTH_COOKIE_NAME } from "./constants";

const COOKIE_NAME = AUTH_COOKIE_NAME;
const COOKIE_MAX_AGE_DAYS = 1; // 24h

function getCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + encodeURIComponent(COOKIE_NAME) + "=([^;]*)")
  );
  const value = match ? decodeURIComponent(match[1]) : null;
  return value && value !== "null" ? value : null;
}

function setCookie(value: string): void {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = typeof window !== "undefined" && window.location?.protocol === "https:";
  document.cookie = [
    `${encodeURIComponent(COOKIE_NAME)}=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${maxAge}`,
    `samesite=lax`,
    secure ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function deleteCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(COOKIE_NAME)}=; path=/; max-age=0; samesite=lax`;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    setCookie(token);
  } else {
    deleteCookie();
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  // Rehydrate from cookie on client (e.g. after full page reload)
  if (typeof document !== "undefined") {
    const fromCookie = getCookieValue();
    if (fromCookie) {
      accessToken = fromCookie;
      return fromCookie;
    }
  }
  return null;
}

export function clearAccessToken(): void {
  accessToken = null;
  deleteCookie();
}

export { AUTH_COOKIE_NAME } from "./constants";
