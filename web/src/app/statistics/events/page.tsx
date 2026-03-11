import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import { loadEvents, loadMonthIncomeTotal, loadMonthPurchaseTotal } from "@/lib/api/statistics";

type EventItem = {
  id?: string;
  name?: string;
  category?: string | { name?: string; id?: string };
  amount?: number;
  type?: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

export default function StatisticsEventsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [refreshing, setRefreshing] = useState(false);
  const userId = currentUserId() ?? "demo-user";
  const projectId = currentProjectId() ?? "demo-project";

  const request = { userId, projectId, year, month };
  const { data, refetch } = useQuery({
    queryKey: ["statistics-events", userId, projectId, year, month],
    queryFn: async () => {
      const [ev, p, i] = await Promise.all([
        loadEvents(request),
        loadMonthPurchaseTotal(request),
        loadMonthIncomeTotal(request),
      ]);
      return {
        events: (ev ?? {}) as Record<string, EventItem[]>,
        purchases: p ?? { amount: 0, limit: 0 },
        incomes: i ?? { amount: 0 },
      };
    },
  });

  const events = data?.events ?? {};
  const purchases = data?.purchases ?? { amount: 0, limit: 0 };
  const incomes = data?.incomes ?? { amount: 0 };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 400);
  };

  const sections = Object.entries(events)
    .map(([dayStr, data]) => ({
      day: parseInt(dayStr, 10),
      title: `${pad(parseInt(dayStr, 10))}.${pad(month)}.${year}`,
      data: (data ?? []) as EventItem[],
    }))
    .filter((s) => !Number.isNaN(s.day))
    .sort((a, b) => b.day - a.day);

  const purchasesTotal = `${purchases.amount.toFixed(0)}$ / ${purchases.amount.toFixed(0)}$ / ${purchases.limit.toFixed(0)}$`;
  const incomesTotal = `${incomes.amount.toFixed(0)}$ / ${incomes.amount.toFixed(0)}$`;

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
        >
          {refreshing ? "Refreshing…" : `${MONTH_NAMES[month - 1]} ${year}`}
        </button>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value) || 1)}
            className="w-14 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
            className="w-20 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-1 text-sm">
        <p className="font-medium">{purchasesTotal}</p>
        <p className="font-medium">{incomesTotal}</p>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm opacity-80">No events for this month.</p>
      ) : (
        <ul className="space-y-6">
          {sections.map(({ title, data }) => (
            <li key={title}>
              <h2 className="mb-2 text-lg font-light text-[var(--foreground)]">{title}</h2>
              <ul className="space-y-2">
                {data.map((event) => {
                  const isIncome = event.type === "income";
                  const categoryName =
                    typeof event.category === "object" ? event.category?.name : event.category;
                  const amount = event.amount ?? 0;
                  const amountStr = (isIncome ? "+" : "-") + amount.toFixed(2) + "$";
                  return (
                    <li
                      key={event.id ?? `${event.name}-${amount}`}
                      className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-[var(--foreground)]">
                          {event.name ?? "—"}
                        </p>
                        <p className="text-sm opacity-80">{categoryName ?? "—"}</p>
                      </div>
                      <span
                        className={
                          isIncome ? "text-[var(--income)]" : "text-[var(--purchase)]"
                        }
                      >
                        {amountStr}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
