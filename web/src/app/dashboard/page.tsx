import { useQuery } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import { loadMonthIncomeTotal, loadMonthPurchaseTotal } from "@/lib/api/statistics";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const userId = currentUserId();
  const projectId = currentProjectId();
  const request = { userId: userId!, projectId: projectId!, year, month };
  const canLoad = Boolean(userId && projectId);

  const { data: purchases } = useQuery({
    queryKey: ["month-purchase-total", userId, projectId, year, month],
    queryFn: () => loadMonthPurchaseTotal(request),
    enabled: canLoad,
  });
  const { data: incomes } = useQuery({
    queryKey: ["month-income-total", userId, projectId, year, month],
    queryFn: () => loadMonthIncomeTotal(request),
    enabled: canLoad,
  });

  const purchaseAmount = purchases?.amount ?? 0;
  const purchaseLimit = purchases?.limit ?? 0;
  const incomeAmount = incomes?.amount ?? 0;
  const monthName = MONTH_NAMES[month - 1];
  const isOverLimit = purchaseLimit > 0 && purchaseAmount > purchaseLimit;
  const isCloseToLimit = purchaseLimit > 0 && purchaseAmount >= purchaseLimit * 0.8 && purchaseAmount <= purchaseLimit;

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm opacity-80">{monthName} {year}</p>

      <div className="flex flex-col gap-4">
        <section
          className={`rounded-xl border bg-[var(--card)] p-4 ${
            isOverLimit ? "border-red-500 dark:border-red-600" : isCloseToLimit ? "border-amber-500 dark:border-amber-600" : "border-[var(--border)]"
          }`}
        >
          <h2 className="mb-2 text-sm font-medium opacity-80">Purchases this month</h2>
          <p className="text-2xl font-bold text-[var(--purchase)]">
            {purchaseAmount.toFixed(0)} $
          </p>
          {purchaseLimit > 0 && (
            <p className="mt-1 text-sm opacity-80">
              Limit: {purchaseLimit.toFixed(0)} $
            </p>
          )}
          {isOverLimit && (
            <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
              You&apos;ve exceeded your purchase limit this month.
            </p>
          )}
          {isCloseToLimit && !isOverLimit && (
            <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400" role="alert">
              Close to your purchase limit.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-sm font-medium opacity-80">Income this month</h2>
          <p className="text-2xl font-bold text-[var(--income)]">
            {incomeAmount.toFixed(0)} $
          </p>
        </section>
      </div>
    </main>
  );
}
