import { apiFetch } from "@/lib/api/httpClient";
import { endpoints } from "@/lib/config/endpoints";

export type Project = {
  id: string;
  name?: string;
  ownerUserId?: string;
  currency?: string;
  archived?: boolean;
  createdAt?: string;
};

export type ProfileSettings = {
  userId: string;
  defaultCurrency: string;
  locale: string;
  notificationsEnabled: boolean;
  activeProjectId?: string | null;
};

export type ProfileCategory = {
  id: string;
  userId: string;
  name: string;
  emoji?: string;
  isPurchase: boolean;
  isIncome: boolean;
  /** Monthly spending limit for purchase categories (optional). */
  monthlyLimit?: number | null;
};

/** Ensures default records exist for the user (e.g. default categories). Idempotent; call after first login. */
export async function runOnboarding(userId: string): Promise<void> {
  await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/onboarding/${userId}`, {
    method: "POST",
  });
}

export async function loadProfileSettings(userId: string): Promise<ProfileSettings | null> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/${userId}`, {
    method: "GET",
  });
  if (!response.ok) return null;
  return (await response.json()) as ProfileSettings;
}

export async function updateProfileSettings(userId: string, payload: Partial<ProfileSettings>): Promise<ProfileSettings | null> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  return (await response.json()) as ProfileSettings;
}

/** Set the active project for the user (persists across sessions). */
export async function setActiveProject(userId: string, projectId: string): Promise<boolean> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/settings/${userId}/active-project`,
    { method: "PUT", body: JSON.stringify({ projectId }) }
  );
  return response.ok;
}

export async function loadProfileCategories(userId: string): Promise<ProfileCategory[]> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/categories/${userId}`, {
    method: "GET",
  });
  if (!response.ok) return [];
  return (await response.json()) as ProfileCategory[];
}

/** Load all projects the user is a member of (includes project currency). */
export async function loadProjectsForUser(userId: string): Promise<Project[]> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/projects/${userId}`, {
    method: "GET",
  });
  if (!response.ok) return [];
  return (await response.json()) as Project[];
}

export type ProjectMember = {
  projectId?: string;
  userId?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
};

/** Load project members (includes role). Use to check if current user is OWNER. */
export async function loadProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/members`,
    { method: "GET" }
  );
  if (!response.ok) return [];
  return (await response.json()) as ProjectMember[];
}

/** Update project currency. Requires OWNER role. */
export async function updateProjectCurrency(
  projectId: string,
  requesterUserId: string,
  currency: string
): Promise<Project | null> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}`,
    {
      method: "PUT",
      body: JSON.stringify({ requesterUserId, currency }),
    }
  );
  if (!response.ok) return null;
  return (await response.json()) as Project;
}

export async function createProfileCategory(
  userId: string,
  payload: Omit<ProfileCategory, "id" | "userId">
): Promise<ProfileCategory | null> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/categories/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  return (await response.json()) as ProfileCategory;
}

export async function updateProfileCategory(
  userId: string,
  categoryId: string,
  payload: Partial<Omit<ProfileCategory, "id" | "userId">>
): Promise<ProfileCategory | null> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/settings/categories/${userId}/${categoryId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  if (!response.ok) return null;
  return (await response.json()) as ProfileCategory;
}

export async function deleteProfileCategory(userId: string, categoryId: string): Promise<boolean> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/settings/categories/${userId}/${categoryId}`,
    {
      method: "DELETE",
    }
  );
  return response.ok;
}
