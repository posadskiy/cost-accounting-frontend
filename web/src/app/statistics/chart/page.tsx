import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import { loadProfileCategories } from "@/lib/api/profileService";
import { loadMonth, loadProjectMonthsList } from "@/lib/api/statistics";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CategoryStat = { amount: number; limit?: number };

function parseMonthLabel(label: string): { year: number; month: number } {
  const parts = label.trim().split(" ");
  const monthStr = parts[0];
  const year = parseInt(parts[1] ?? String(new Date().getFullYear()), 10);
  const month = MONTH_NAMES.indexOf(monthStr) + 1 || new Date().getMonth() + 1;
  return { year, month: month || 1 };
}

/** Resolve category ID to display name using profile categories. */
function getCategoryDisplayName(
  categoryId: string,
  profileCategories: { id: string; name: string; emoji?: string | null }[]
): string {
  if (!categoryId) return "—";
  const found = profileCategories.find((c) => c.id === categoryId);
  if (found) return found.emoji ? `${found.emoji} ${found.name}` : found.name;
  return "—";
}

export default function StatisticsChartPage() {
  const now = new Date();
  const userId = currentUserId();
  const projectId = currentProjectId();
  const [selectedLabel, setSelectedLabel] = useState("");
  const canLoad = Boolean(userId && projectId);

  const { data: months = [], isLoading: monthsLoading } = useQuery({
    queryKey: ["project-months", userId, projectId],
    queryFn: () =>
      loadProjectMonthsList({
        userId: userId!,
        projectId: projectId!,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
    enabled: canLoad,
  });

  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const resolvedLabel = selectedLabel || months[0] || (months.length === 0 && !monthsLoading ? currentMonthLabel : "");
  const { year, month } = resolvedLabel
    ? parseMonthLabel(resolvedLabel)
    : { year: now.getFullYear(), month: now.getMonth() + 1 };

  const { data: profileCategories = [] } = useQuery({
    queryKey: ["profile-categories", userId],
    queryFn: () => loadProfileCategories(userId!),
    enabled: !!userId,
  });

  const { data: payload = {} } = useQuery({
    queryKey: ["month-stats", userId, projectId, year, month],
    queryFn: () => loadMonth({ userId: userId!, projectId: projectId!, year, month }),
    enabled: canLoad && !!resolvedLabel,
  });

  const purchaseCategories = payload.purchaseCategories ?? {};
  const incomeCategories = payload.incomeCategories ?? {};
  const purchaseEntries = Object.entries(purchaseCategories);
  const incomeEntries = Object.entries(incomeCategories);
  const purchasesTotal = purchaseEntries.reduce((s, [, v]) => s + (v.amount ?? 0), 0);
  const purchasesLimit = purchaseEntries.reduce((s, [, v]) => s + (v.limit ?? 0), 0);
  const incomesTotal = incomeEntries.reduce((s, [, v]) => s + (v.amount ?? 0), 0);

  const maxPurchase = Math.max(...purchaseEntries.map(([, v]) => v.amount ?? 0), 1);
  const maxIncome = Math.max(...incomeEntries.map(([, v]) => v.amount ?? 0), 1);

  /** 0 = exceeded (>100%), 1 = high (80–100%), 2 = normal (<80% or no limit). */
  function purchaseTier(stat: CategoryStat): number {
    const limit = stat.limit ?? 0;
    if (limit <= 0) return 2;
    const pct = (100 * (stat.amount ?? 0)) / limit;
    if (pct > 100) return 0;
    if (pct >= 80) return 1;
    return 2;
  }

  const sortedPurchaseEntries = [...purchaseEntries].sort(([, a], [, b]) => {
    const tierA = purchaseTier(a);
    const tierB = purchaseTier(b);
    if (tierA !== tierB) return tierA - tierB;
    const limitA = a.limit ?? 0;
    const limitB = b.limit ?? 0;
    const pctA = limitA > 0 ? (100 * (a.amount ?? 0)) / limitA : 0;
    const pctB = limitB > 0 ? (100 * (b.amount ?? 0)) / limitB : 0;
    return pctB - pctA; // higher % first within same tier
  });

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <header className="mb-4">
        <label className="block text-sm font-medium opacity-80">Month</label>
        <select
          value={resolvedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        >
          {monthsLoading && <option value="">Loading…</option>}
          {!monthsLoading && months.length === 0 && (
            <option value={currentMonthLabel}>{currentMonthLabel}</option>
          )}
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-bold">Purchases</h2>
        <p className="mb-3 text-sm">
          {purchasesTotal.toFixed(0)} / {purchasesLimit.toFixed(0)} $
        </p>
        {purchasesLimit > 0 && purchasesTotal > purchasesLimit && (
          <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
            Over your total purchase limit this month.
          </p>
        )}
        {purchasesLimit > 0 && purchasesTotal >= purchasesLimit * 0.8 && purchasesTotal <= purchasesLimit && (
          <p className="mb-2 text-sm font-medium text-amber-600 dark:text-amber-400" role="alert">
            Close to your total purchase limit.
          </p>
        )}
        <ul className="space-y-2">
          {sortedPurchaseEntries.map(([categoryId, stat]) => {
            const amount = stat.amount ?? 0;
            const limit = stat.limit ?? 0;
            const over = limit > 0 && amount > limit;
            const close = limit > 0 && amount >= limit * 0.8 && amount <= limit;
            return (
              <li key={categoryId} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-sm" title={categoryId}>
                  {getCategoryDisplayName(categoryId, profileCategories)}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`h-6 rounded opacity-80 ${
                      over ? "bg-red-500 dark:bg-red-600" : close ? "bg-amber-500 dark:bg-amber-600" : "bg-neutral-300 dark:bg-neutral-600"
                    }`}
                    style={{
                      width: limit > 0
                        ? `${Math.min(100, (100 * amount) / limit)}%`
                        : `${Math.min(100, (100 * amount) / maxPurchase)}%`,
                    }}
                  />
                </div>
                <span
                  className={`shrink-0 text-sm ${over ? "text-red-600 dark:text-red-400 font-medium" : close ? "text-amber-600 dark:text-amber-400" : "text-[var(--foreground)]"}`}
                >
                  {amount.toFixed(0)} $ {limit > 0 && ` / ${limit.toFixed(0)} $ limit`}
                </span>
              </li>
            );
          })}
          {purchaseEntries.length === 0 && (
            <li className="text-sm opacity-70">No purchase data</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Incomes</h2>
        <p className="mb-3 text-sm">{incomesTotal.toFixed(0)} $</p>
        <ul className="space-y-2">
          {incomeEntries.map(([categoryId, stat]) => (
            <li key={categoryId} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm" title={categoryId}>
                {getCategoryDisplayName(categoryId, profileCategories)}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="h-6 rounded bg-[var(--income)] opacity-80"
                  style={{
                    width: `${Math.min(100, (100 * (stat.amount ?? 0)) / maxIncome)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-sm text-[var(--income)]">
                {(stat.amount ?? 0).toFixed(0)} $
              </span>
            </li>
          ))}
          {incomeEntries.length === 0 && (
            <li className="text-sm opacity-70">No income data</li>
          )}
        </ul>
      </section>
    </main>
  );
}
