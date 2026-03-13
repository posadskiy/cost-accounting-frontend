import { apiFetch } from "@/lib/api/httpClient";
import { endpoints } from "@/lib/config/endpoints";

export type Category = {
  id: string;
  name: string;
  emoji?: string;
};

type MoneyActionPayload = {
  id?: string;
  category: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
  isPrivate: boolean;
};

export async function loadPurchaseCategories(userId: string): Promise<Category[]> {
  const projectId =
    typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined;
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/purchase/categories`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId }),
  });
  if (!response.ok) return [];
  return (await response.json()) as Category[];
}

export async function loadIncomeCategories(userId: string): Promise<Category[]> {
  const projectId =
    typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined;
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/income/categories`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId }),
  });
  if (!response.ok) return [];
  return (await response.json()) as Category[];
}

export async function loadCurrencies(): Promise<string[]> {
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/currency/all`, { method: "GET" });
  if (!response.ok) return ["USD"];
  return (await response.json()) as string[];
}

export async function savePurchase(userId: string, payload: MoneyActionPayload, projectId?: string): Promise<boolean> {
  const resolvedProjectId =
    projectId ??
    (typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined);
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/purchase/add`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId: resolvedProjectId, purchase: payload }),
  });
  return response.ok;
}

export async function saveIncome(userId: string, payload: MoneyActionPayload, projectId?: string): Promise<boolean> {
  const resolvedProjectId =
    projectId ??
    (typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined);
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/income/add`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId: resolvedProjectId, income: payload }),
  });
  return response.ok;
}

export async function deletePurchase(userId: string, purchaseId: string, projectId?: string): Promise<boolean> {
  const resolvedProjectId =
    projectId ??
    (typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined);
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/purchase/delete`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId: resolvedProjectId, purchaseId }),
  });
  return response.ok;
}

export async function deleteIncome(userId: string, incomeId: string, projectId?: string): Promise<boolean> {
  const resolvedProjectId =
    projectId ??
    (typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") ?? undefined : undefined);
  const response = await apiFetch(`${endpoints.moneyActionsBaseUrl}/v1/income/delete`, {
    method: "POST",
    body: JSON.stringify({ userId, projectId: resolvedProjectId, incomeId }),
  });
  return response.ok;
}

export async function saveSplitPurchase(
  ownerUserId: string,
  participantUserIds: string[],
  payload: MoneyActionPayload,
  projectId?: string,
  amountsPerParticipant?: number[]
): Promise<boolean> {
  const participants = normalizeParticipants(ownerUserId, participantUserIds);
  const useCustom =
    amountsPerParticipant &&
    amountsPerParticipant.length === participants.length &&
    amountsPerParticipant.every((a) => a >= 0);
  const splitAmounts = useCustom
    ? amountsPerParticipant!
    : participants.map(() =>
        Number((payload.amount / participants.length).toFixed(2))
      );
  const results = await Promise.all(
    participants.map((participantId, i) =>
      savePurchase(participantId, {
        ...payload,
        amount: splitAmounts[i],
      }, projectId)
    )
  );
  return results.every(Boolean);
}

export async function saveSplitIncome(
  ownerUserId: string,
  participantUserIds: string[],
  payload: MoneyActionPayload,
  projectId?: string,
  amountsPerParticipant?: number[]
): Promise<boolean> {
  const participants = normalizeParticipants(ownerUserId, participantUserIds);
  const useCustom =
    amountsPerParticipant &&
    amountsPerParticipant.length === participants.length &&
    amountsPerParticipant.every((a) => a >= 0);
  const splitAmounts = useCustom
    ? amountsPerParticipant!
    : participants.map(() =>
        Number((payload.amount / participants.length).toFixed(2))
      );
  const results = await Promise.all(
    participants.map((participantId, i) =>
      saveIncome(participantId, {
        ...payload,
        amount: splitAmounts[i],
      }, projectId)
    )
  );
  return results.every(Boolean);
}

export function parseParticipantIds(csv: string): string[] {
  return csv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function splitAmountPerParticipant(amount: number, participantCount: number): number {
  if (participantCount <= 0) return amount;
  return Number((amount / participantCount).toFixed(2));
}

export function normalizeParticipants(ownerUserId: string, participantUserIds: string[]): string[] {
  const unique = new Set<string>([ownerUserId]);
  for (const participant of participantUserIds) {
    const normalized = participant.trim();
    if (normalized) unique.add(normalized);
  }
  return [...unique];
}
