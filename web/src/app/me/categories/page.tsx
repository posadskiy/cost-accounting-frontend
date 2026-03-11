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

const btnPrimary =
  "rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";
const btnSecondary =
  "rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 font-medium text-[var(--foreground)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2";

export default function CategoriesPage() {
  const userId = currentUserId() ?? "demo-user";
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isPurchase, setIsPurchase] = useState(true);
  const [isIncome, setIsIncome] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editIsPurchase, setEditIsPurchase] = useState(true);
  const [editIsIncome, setEditIsIncome] = useState(false);

  const { data: categories = [], refetch } = useQuery<ProfileCategory[]>({
    queryKey: ["profile-categories", userId],
    queryFn: () => loadProfileCategories(userId),
  });

  async function onCreate() {
    if (!name.trim()) return;
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
    if (editingId == null || !editName.trim()) return;
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

  async function onDelete(categoryId: string) {
    const ok = await deleteProfileCategory(userId, categoryId);
    if (ok) {
      if (editingId === categoryId) setEditingId(null);
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

      {/* List with edit */}
      <section className="mt-6">
        <h2 className="mb-3 font-medium">All categories</h2>
        <ul className="space-y-2">
          {categories.map((c) => (
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
                <>
                  <span className="font-medium">
                    {c.emoji ? `${c.emoji} ` : ""}{c.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-700">
                      {c.isPurchase ? "Purchase" : ""}
                      {c.isPurchase && c.isIncome ? " · " : ""}
                      {c.isIncome ? "Income" : ""}
                    </span>
                    <button
                      type="button"
                      className="text-sm underline"
                      onClick={() => startEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm text-red-600 underline"
                      onClick={() => onDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {categories.length === 0 && (
          <p className="text-sm text-neutral-500">No categories yet. Add one above or refresh to load defaults.</p>
        )}
      </section>
    </main>
  );
}
