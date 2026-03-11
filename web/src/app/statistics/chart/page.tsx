import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
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

export default function StatisticsChartPage() {
  const now = new Date();
  const userId = currentUserId() ?? "demo-user";
  const projectId = currentProjectId() ?? "demo-project";
  const [selectedLabel, setSelectedLabel] = useState("");

  const { data: months = [], isLoading: monthsLoading } = useQuery({
    queryKey: ["project-months", userId, projectId],
    queryFn: () => loadProjectMonthsList({ userId, projectId, year: now.getFullYear(), month: now.getMonth() + 1 }),
  });

  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const resolvedLabel = selectedLabel || months[0] || (months.length === 0 && !monthsLoading ? currentMonthLabel : "");
  const { year, month } = resolvedLabel
    ? parseMonthLabel(resolvedLabel)
    : { year: now.getFullYear(), month: now.getMonth() + 1 };

  const { data: payload = {} } = useQuery({
    queryKey: ["month-stats", userId, projectId, year, month],
    queryFn: () => loadMonth({ userId, projectId, year, month }),
    enabled: !!resolvedLabel,
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
        <ul className="space-y-2">
          {purchaseEntries.map(([name, stat]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm">{name}</span>
              <div className="min-w-0 flex-1">
                <div
                  className="h-6 rounded bg-[var(--purchase)] opacity-80"
                  style={{
                    width: `${Math.min(100, (100 * (stat.amount ?? 0)) / maxPurchase)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-sm text-[var(--purchase)]">
                {(stat.amount ?? 0).toFixed(0)} $
              </span>
            </li>
          ))}
          {purchaseEntries.length === 0 && (
            <li className="text-sm opacity-70">No purchase data</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Incomes</h2>
        <p className="mb-3 text-sm">{incomesTotal.toFixed(0)} $</p>
        <ul className="space-y-2">
          {incomeEntries.map(([name, stat]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm">{name}</span>
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
