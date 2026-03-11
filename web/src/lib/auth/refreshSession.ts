import { setAccessToken } from "./tokenStore";
import { endpoints } from "@/lib/config/endpoints";

export async function refreshSession(): Promise<boolean> {
  // Refresh token is expected in HttpOnly cookie.
  // Endpoint contract comes from external auth-service.
  const response = await fetch(`${endpoints.authBaseUrl}/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    setAccessToken(null);
    return false;
  }

  const payload = (await response.json()) as { accessToken?: string };
  setAccessToken(payload.accessToken ?? null);
  return Boolean(payload.accessToken);
}
