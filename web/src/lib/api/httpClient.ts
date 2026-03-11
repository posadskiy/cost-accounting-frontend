import { getAccessToken } from "@/lib/auth/tokenStore";
import { refreshSession } from "@/lib/auth/refreshSession";

type RequestInitWithRetry = RequestInit & {
  _retry?: boolean;
};

export async function apiFetch(input: string, init: RequestInitWithRetry = {}): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || init._retry) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return response;
  }

  return apiFetch(input, { ...init, _retry: true });
}
