import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentUserId } from "@/lib/api/auth";
import {
  createProfileCategory,
  deleteProfileCategory,
  loadProfileCategories,
  updateProfileCategory,
  ProfileCategory,
} from "@/lib/api/profileService";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

const btnPrimary =
  "rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";
const btnSecondary =
  "rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 font-medium text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

export default function CategoriesPage() {
  const userId = currentUserId();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isPurchase, setIsPurchase] = useState(true);
  const [isIncome, setIsIncome] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editIsPurchase, setEditIsPurchase] = useState(true);
  const [editIsIncome, setEditIsIncome] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const { data: categories = [], refetch } = useQuery<ProfileCategory[]>({
    queryKey: ["profile-categories", userId],
    queryFn: () => loadProfileCategories(userId!),
    enabled: !!userId,
  });

  const purchaseCategories = categories.filter((c) => c.isPurchase);
  const incomeCategories = categories.filter((c) => c.isIncome);

  async function onCreate() {
    if (!name.trim() || !userId) return;
    const created = await createProfileCategory(userId, {
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      isPurchase,
      isIncome,
    });
    if (created) {
      setName("");
      setEmoji("");
      await refetch();
    }
  }

  function startEdit(c: ProfileCategory) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmoji(c.emoji ?? "");
    setEditIsPurchase(c.isPurchase);
    setEditIsIncome(c.isIncome);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onSaveEdit() {
    if (editingId == null || !editName.trim() || !userId) return;
    const updated = await updateProfileCategory(userId, editingId, {
      name: editName.trim(),
      emoji: editEmoji.trim() || undefined,
      isPurchase: editIsPurchase,
      isIncome: editIsIncome,
    });
    if (updated) {
      setEditingId(null);
      await refetch();
    }
  }

  async function confirmDelete() {
    if (!userId || !categoryToDelete) return;
    const ok = await deleteProfileCategory(userId, categoryToDelete);
    if (ok) {
      if (editingId === categoryToDelete) setEditingId(null);
      setCategoryToDelete(null);
      await refetch();
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">My Categories</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Add and edit categories for purchases and income. New users get a few defaults.
      </p>

      {/* Add new */}
      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-medium">Add category</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            value={name}
            placeholder="Category name"
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputClass}
            value={emoji}
            placeholder="Emoji (optional)"
            onChange={(e) => setEmoji(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPurchase}
              onChange={(e) => setIsPurchase(e.target.checked)}
            />
            Purchase
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isIncome}
              onChange={(e) => setIsIncome(e.target.checked)}
            />
            Income
          </label>
          <button type="button" className={btnPrimary} onClick={onCreate}>
            Add category
          </button>
        </div>
      </section>

      {/* Purchase categories */}
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Purchase categories</h2>
        <ul className="space-y-2">
          {purchaseCategories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === c.id ? (
                <>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      value={editName}
                      placeholder="Name"
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <input
                      className={inputClass}
                      value={editEmoji}
                      placeholder="Emoji"
                      onChange={(e) => setEditEmoji(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editIsPurchase}
                        onChange={(e) => setEditIsPurchase(e.target.checked)}
                      />
                      Purchase
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editIsIncome}
                        onChange={(e) => setEditIsIncome(e.target.checked)}
                      />
                      Income
                    </label>
                    <button type="button" className={btnPrimary} onClick={onSaveEdit}>
                      Save
                    </button>
                    <button type="button" className={btnSecondary} onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">
                    {c.emoji ? `${c.emoji} ` : ""}{c.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.isIncome && (
                      <span className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                        Also income
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Edit"
                      className="flex rounded p-2 text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      onClick={() => startEdit(c)}
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      className="flex rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                      onClick={() => setCategoryToDelete(c.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {purchaseCategories.length === 0 && (
          <p className="text-sm text-neutral-500">No purchase categories yet.</p>
        )}
      </section>

      {/* Income categories */}
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Income categories</h2>
        <ul className="space-y-2">
          {incomeCategories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === c.id ? (
                <>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      value={editName}
                      placeholder="Name"
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <input
                      className={inputClass}
                      value={editEmoji}
                      placeholder="Emoji"
                      onChange={(e) => setEditEmoji(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editIsPurchase}
                        onChange={(e) => setEditIsPurchase(e.target.checked)}
                      />
                      Purchase
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editIsIncome}
                        onChange={(e) => setEditIsIncome(e.target.checked)}
                      />
                      Income
                    </label>
                    <button type="button" className={btnPrimary} onClick={onSaveEdit}>
                      Save
                    </button>
                    <button type="button" className={btnSecondary} onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">
                    {c.emoji ? `${c.emoji} ` : ""}{c.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.isPurchase && (
                      <span className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                        Also purchase
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Edit"
                      className="flex rounded p-2 text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      onClick={() => startEdit(c)}
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      className="flex rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                      onClick={() => setCategoryToDelete(c.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {incomeCategories.length === 0 && (
          <p className="text-sm text-neutral-500">No income categories yet.</p>
        )}
      </section>

      {/* Delete confirmation */}
      {categoryToDelete && (() => {
        const cat = categories.find((c) => c.id === categoryToDelete);
        const displayName = cat ? (cat.emoji ? `${cat.emoji} ` : "") + (cat.name ?? "this category") : "this category";
        return (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-[var(--card)] p-4 shadow-lg">
            <h3 id="confirm-delete-title" className="text-lg font-bold">Delete category</h3>
            <p className="mt-2 text-sm opacity-90">
              Are you sure you want to delete <strong>{displayName}</strong>? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 font-medium"
                onClick={() => setCategoryToDelete(null)}
              >
                No
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-[var(--purchase)] px-4 py-2.5 font-medium text-white"
                onClick={confirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </main>
  );
}
