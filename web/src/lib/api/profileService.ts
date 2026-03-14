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

export type OnboardingResult = {
  needsProjectSelection: boolean;
};

/** Ensures default records exist for the user (e.g. default categories). Idempotent; call after first login. Does not create a project. */
export async function runOnboarding(userId: string): Promise<OnboardingResult> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/settings/onboarding/${userId}`,
    { method: "POST" }
  );
  if (!response.ok) return { needsProjectSelection: true };
  return (await response.json()) as OnboardingResult;
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

export type CreateProjectPayload = {
  ownerUserId: string;
  name?: string;
  currency?: string;
};

/** Create a new project and set it as active for the owner. */
export async function createProject(payload: CreateProjectPayload): Promise<Project | null> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/projects`, {
    method: "POST",
    body: JSON.stringify({
      ownerUserId: payload.ownerUserId,
      name: payload.name ?? "Family budget",
      currency: payload.currency ?? "USD",
    }),
  });
  if (!response.ok) return null;
  return (await response.json()) as Project;
}

export type JoinProjectByCodePayload = {
  userId: string;
  code: string;
};

export type JoinProjectResult = {
  projectId?: string;
  userId?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
};

/** Join a project by invite code. On success, project may be set as active if user had none. */
export async function joinProjectByCode(
  payload: JoinProjectByCodePayload
): Promise<JoinProjectResult | null> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/projects/join`, {
    method: "POST",
    body: JSON.stringify({ userId: payload.userId, code: payload.code.trim().toUpperCase() }),
  });
  if (!response.ok) return null;
  return (await response.json()) as JoinProjectResult;
}

export type ProjectMember = {
  projectId?: string;
  userId?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  joinedViaInviteId?: string | null;
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

export type ProjectInvite = {
  id: string;
  projectId: string;
  createdByUserId?: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  revoked: boolean;
  createdAt: string;
};

/** List invites for a project. OWNER only. */
export async function loadProjectInvites(
  projectId: string,
  requesterUserId: string
): Promise<ProjectInvite[]> {
  const url = `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/invites?requesterUserId=${encodeURIComponent(requesterUserId)}`;
  const response = await apiFetch(url, { method: "GET" });
  if (!response.ok) return [];
  return (await response.json()) as ProjectInvite[];
}

export type CreateProjectInvitePayload = {
  requesterUserId: string;
  expiresInHours?: number;
  maxUses?: number;
};

export type CreateProjectInviteResult = {
  inviteId: string;
  projectId: string;
  code: string;
  expiresAt: string;
  maxUses: number;
};

/** Create an invite for the project. OWNER only. Code is returned only once. */
export async function createProjectInvite(
  projectId: string,
  payload: CreateProjectInvitePayload
): Promise<CreateProjectInviteResult | null> {
  const response = await apiFetch(
    `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/invites`,
    {
      method: "POST",
      body: JSON.stringify({
        requesterUserId: payload.requesterUserId,
        expiresInHours: payload.expiresInHours ?? 24,
        maxUses: payload.maxUses ?? 1,
      }),
    }
  );
  if (!response.ok) return null;
  return (await response.json()) as CreateProjectInviteResult;
}

/** Revoke an invite. OWNER only. */
export async function revokeProjectInvite(
  projectId: string,
  inviteId: string,
  requesterUserId: string
): Promise<boolean> {
  const url = `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/invites/${inviteId}?requesterUserId=${encodeURIComponent(requesterUserId)}`;
  const response = await apiFetch(url, { method: "DELETE" });
  return response.ok;
}

/** Remove a member from the project. OWNER only. Cannot remove self or the project owner. */
export async function removeProjectMember(
  projectId: string,
  memberUserId: string,
  requesterUserId: string
): Promise<boolean> {
  const url = `${endpoints.profileServiceBaseUrl}/v1/profile/projects/${projectId}/members/${memberUserId}?requesterUserId=${encodeURIComponent(requesterUserId)}`;
  const response = await apiFetch(url, { method: "DELETE" });
  return response.ok;
}
