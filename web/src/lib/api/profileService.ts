import { apiFetch } from "@/lib/api/httpClient";
import { endpoints } from "@/lib/config/endpoints";

export type ProfileSettings = {
  userId: string;
  defaultCurrency: string;
  locale: string;
  notificationsEnabled: boolean;
};

export type ProfileCategory = {
  id: string;
  userId: string;
  name: string;
  emoji?: string;
  isPurchase: boolean;
  isIncome: boolean;
};

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

export async function loadProfileCategories(userId: string): Promise<ProfileCategory[]> {
  const response = await apiFetch(`${endpoints.profileServiceBaseUrl}/v1/profile/settings/categories/${userId}`, {
    method: "GET",
  });
  if (!response.ok) return [];
  return (await response.json()) as ProfileCategory[];
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
