import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  loadProfileCategories,
  loadProfileSettings,
  loadProjectsForUser,
  updateProfileCategory,
  type ProfileCategory,
} from "@/lib/api/profileService";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CancelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function SettingsLimitsPage() {
  const userId = currentUserId();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");

  const projectId = currentProjectId();
  const { data: categories = [], refetch } = useQuery<ProfileCategory[]>({
    queryKey: ["profile-categories", userId],
    queryFn: () => loadProfileCategories(userId!),
    enabled: !!userId,
  });
  const { data: profileSettings } = useQuery({
    queryKey: ["profile-settings", userId],
    queryFn: () => loadProfileSettings(userId!),
    enabled: !!userId,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["profile-projects", userId],
    queryFn: () => loadProjectsForUser(userId!),
    enabled: !!userId,
  });
  const currency = useMemo(() => {
    const project = projectId ? projects.find((p) => p.id === projectId) : undefined;
    return project?.currency ?? profileSettings?.defaultCurrency ?? "USD";
  }, [projectId, projects, profileSettings?.defaultCurrency]);

  const purchaseCategories = categories.filter((c) => c.isPurchase);
  const totalLimit = purchaseCategories.reduce((sum, c) => sum + (c.monthlyLimit ?? 0), 0);

  function startEdit(c: ProfileCategory) {
    setEditingId(c.id);
    setEditLimit(c.monthlyLimit != null && c.monthlyLimit > 0 ? String(c.monthlyLimit) : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLimit("");
  }

  async function confirmLimit() {
    if (editingId == null || !userId) return;
    const val = editLimit.trim() ? Number(editLimit) : undefined;
    const num = val != null && !Number.isNaN(val) && val > 0 ? val : undefined;
    const updated = await updateProfileCategory(userId, editingId, {
      monthlyLimit: num,
    });
    if (updated) {
      setEditingId(null);
      setEditLimit("");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["profile-categories", userId] });
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Monthly limits</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Set a monthly spending limit for each purchase category. The app will notify you when you’re close to or over a limit.
      </p>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-1 text-sm font-medium opacity-80">Total monthly limit</h2>
        <p className="text-xl font-bold">
          {totalLimit > 0 ? `${totalLimit.toFixed(0)} ${currency}` : "—"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {totalLimit > 0
            ? "Sum of all purchase category limits set below."
            : purchaseCategories.length > 0
              ? "Set limits below to see the total."
              : "Add purchase categories and set limits to see the total."}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-medium">Limits by category</h2>
        <ul className="space-y-2">
          {purchaseCategories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === c.id ? (
                <div className="flex w-full flex-wrap items-center gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {c.emoji ? `${c.emoji} ` : ""}{c.name}
                  </span>
                  <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                    <label className="sr-only">Monthly limit ({currency})</label>
                    <input
                      className={`${inputClass} max-w-[8rem]`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Not set"
                      value={editLimit}
                      onChange={(e) => setEditLimit(e.target.value)}
                      autoFocus
                    />
                    <span className="text-sm opacity-70">{currency}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Confirm"
                      className="flex rounded p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-950/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={confirmLimit}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel"
                      className="flex rounded p-2 text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      onClick={cancelEdit}
                    >
                      <CancelIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">
                    {c.emoji ? `${c.emoji} ` : ""}{c.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                      {c.monthlyLimit != null && c.monthlyLimit > 0
                        ? `${Number(c.monthlyLimit).toFixed(0)} ${currency} / month`
                        : "Not set"}
                    </span>
                    <button
                      type="button"
                      aria-label="Edit limit"
                      className="flex rounded p-2 text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      onClick={() => startEdit(c)}
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {purchaseCategories.length === 0 && (
          <p className="text-sm text-neutral-500">No purchase categories yet. Add them in Categories settings.</p>
        )}
      </section>
    </main>
  );
}
