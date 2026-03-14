import { apiFetch } from "@/lib/api/httpClient";
import { endpoints } from "@/lib/config/endpoints";

type StatsRequest = {
  userId: string;
  projectId?: string;
  year: number;
  month: number;
};

export type EventsListRequest = {
  userId: string;
  projectId?: string;
  /** Current month mode when fromDate/toDate omitted */
  year?: number;
  month?: number;
  /** Custom period (yyyy-MM-dd) */
  fromDate?: string;
  toDate?: string;
  limit: number;
  offset: number;
};

export type EventsListResponse = {
  actions: unknown[];
  hasMore: boolean;
};

export async function loadEvents(request: StatsRequest): Promise<Record<string, unknown[]>> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/events`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return {};
  return (await response.json()) as Record<string, unknown[]>;
}

export async function loadEventsList(request: EventsListRequest): Promise<EventsListResponse> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/events/list`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return { actions: [], hasMore: false };
  return (await response.json()) as EventsListResponse;
}

export async function loadMonthPurchaseTotal(request: StatsRequest): Promise<{ amount: number; limit: number }> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/monthPurchaseTotal`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return { amount: 0, limit: 0 };
  const payload = (await response.json()) as { amount?: number; limit?: number };
  return { amount: payload.amount ?? 0, limit: payload.limit ?? 0 };
}

export async function loadMonthIncomeTotal(request: StatsRequest): Promise<{ amount: number }> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/monthIncomeTotal`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return { amount: 0 };
  const payload = (await response.json()) as { amount?: number };
  return { amount: payload.amount ?? 0 };
}

export async function loadProjectMonthsList(request: StatsRequest): Promise<string[]> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/projectMonthsList`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return [];
  return (await response.json()) as string[];
}

export async function loadMonth(request: StatsRequest): Promise<{
  purchaseCategories?: Record<string, { amount: number; limit: number }>;
  incomeCategories?: Record<string, { amount: number; limit: number }>;
}> {
  const response = await apiFetch(`${endpoints.statisticsBaseUrl}/v1/statistics/month`, {
    method: "POST",
    body: JSON.stringify(request),
  });
  if (!response.ok) return {};
  return (await response.json()) as {
    purchaseCategories?: Record<string, { amount: number; limit: number }>;
    incomeCategories?: Record<string, { amount: number; limit: number }>;
  };
}
