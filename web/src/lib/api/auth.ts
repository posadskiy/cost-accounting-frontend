import { apiFetch } from "@/lib/api/httpClient";
import { setAccessToken, clearAccessToken, getAccessToken } from "@/lib/auth/tokenStore";
import { endpoints } from "@/lib/config/endpoints";

type LoginResult = {
  id?: string;
  userId?: string;
  user_id?: string;
  /** Auth service returns user id as "username" in the JSON body */
  username?: string;
  projectId?: string;
  project_id?: string;
  accessToken?: string;
  /** Auth service may return snake_case (e.g. Micronaut LoginController) */
  access_token?: string;
};

/** Resolve user id from login response (id, userId, user_id, or username). JWT "sub" used as fallback in login(). */
function userIdFromPayload(p: LoginResult): string | undefined {
  return p.id ?? p.userId ?? p.user_id ?? p.username;
}

/** Resolve project id from login response (supports projectId, project_id). */
function projectIdFromPayload(p: LoginResult): string | undefined {
  return p.projectId ?? p.project_id;
}

/**
 * Decode JWT payload (no verification; used only to read user id when auth API does not return it).
 * Uses "sub" (subject) claim, or custom "userId" / "user_id" if present.
 */
function userIdFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const sub = payload.sub;
    if (typeof sub === "string" && sub) return sub;
    const uid = payload.userId ?? payload.user_id;
    if (typeof uid === "string" && uid) return uid;
    return null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  const response = await apiFetch(`${endpoints.authBaseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as LoginResult;
  const token = payload.accessToken ?? payload.access_token;
  if (token) {
    setAccessToken(token);
  }
  let uid = userIdFromPayload(payload);
  if (!uid && token) {
    uid = userIdFromJwt(token) ?? undefined;
  }
  if (uid) {
    sessionStorage.setItem("costy_user_id", uid);
  }
  const pid = projectIdFromPayload(payload);
  if (pid) {
    sessionStorage.setItem("costy_project_id", pid);
  }
  return { ...payload, accessToken: token, id: uid ?? payload.id };
}

export function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  let uid = sessionStorage.getItem("costy_user_id");
  if (uid) return uid;
  const token = getAccessToken();
  if (token) {
    uid = userIdFromJwt(token);
    if (uid) {
      sessionStorage.setItem("costy_user_id", uid);
      return uid;
    }
  }
  return null;
}

export function currentProjectId(): string | null {
  return typeof window === "undefined" ? null : sessionStorage.getItem("costy_project_id");
}

/** Sync active project to session (e.g. after onboarding or loading profile settings). */
export function setCurrentProjectId(projectId: string | null): void {
  if (typeof window === "undefined") return;
  if (projectId) {
    sessionStorage.setItem("costy_project_id", projectId);
  } else {
    sessionStorage.removeItem("costy_project_id");
  }
}

/**
 * Logs out the current user: clears token (and cookie), user id, and project id.
 * Call this before redirecting to /login (e.g. from a Logout button).
 */
export function logout(): void {
  clearAccessToken();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("costy_user_id");
    sessionStorage.removeItem("costy_project_id");
  }
}
