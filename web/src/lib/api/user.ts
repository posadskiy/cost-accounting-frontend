import { apiFetch } from "@/lib/api/httpClient";
import { endpoints } from "@/lib/config/endpoints";

export type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  currency?: string;
};

/** Response from GET /v0/user/me */
export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  createdVia: string;
};

export type ProjectUser = {
  id: string;
  name?: string;
  email?: string;
};

/** Load current user via GET /v0/user/me (uses auth token). */
export async function loadCurrentUser(): Promise<CurrentUser | null> {
  const response = await apiFetch(`${endpoints.userBaseUrl}/v0/user/me`, { method: "GET" });
  if (!response.ok) return null;
  return (await response.json()) as CurrentUser;
}

export async function loadUser(id: string): Promise<UserProfile | null> {
  const response = await apiFetch(`${endpoints.userBaseUrl}/v0/user/${id}`, { method: "GET" });
  if (!response.ok) return null;
  return (await response.json()) as UserProfile;
}

export async function updateUser(profile: UserProfile): Promise<UserProfile | null> {
  const response = await apiFetch(`${endpoints.userBaseUrl}/user`, {
    method: "POST",
    body: JSON.stringify(profile),
  });
  if (!response.ok) return null;
  return (await response.json()) as UserProfile;
}

export async function loadProjectUsers(projectId: string): Promise<ProjectUser[]> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/members`, {
    method: "GET",
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as Array<{ userId?: string; role?: string; status?: string }>;
  return payload
    .map((member) => ({
      id: member.userId ?? "",
    }))
    .filter((user) => Boolean(user.id));
}
