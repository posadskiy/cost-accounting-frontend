import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  createProjectCategory,
  deleteProjectCategory,
  loadProjectCategories,
  loadProjectMembers,
  updateProjectCategory,
  type ProjectCategory,
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
  const projectId = currentProjectId();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isPurchase, setIsPurchase] = useState(true); // true = Purchase, false = Income

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editIsPurchase, setEditIsPurchase] = useState(true);
  const [editIsIncome, setEditIsIncome] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<null | "add" | "edit">(null);

  const { data: categories = [], refetch } = useQuery<ProjectCategory[]>({
    queryKey: ["project-categories", projectId],
    queryFn: () => loadProjectCategories(projectId!),
    enabled: !!projectId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => loadProjectMembers(projectId!),
    enabled: !!projectId,
  });

  const isOwner = useMemo(
    () => members.some((m) => m.userId === userId && m.role === "OWNER"),
    [members, userId]
  );

  const purchaseCategories = categories.filter((c) => c.isPurchase);
  const incomeCategories = categories.filter((c) => c.isIncome);

  async function onCreate() {
    if (!name.trim() || !userId || !projectId || !isOwner) return;
    const created = await createProjectCategory(
      projectId,
      { name: name.trim(), emoji: emoji.trim() || undefined, isPurchase, isIncome: !isPurchase },
      userId
    );
    if (created) {
      setName("");
      setEmoji("");
      await refetch();
    }
  }

  function startEdit(c: ProjectCategory) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmoji(c.emoji ?? "");
    // Switch: exactly one of Purchase / Income (prefer Purchase if both set)
    setEditIsPurchase(c.isPurchase);
    setEditIsIncome(!c.isPurchase);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onSaveEdit() {
    if (editingId == null || !editName.trim() || !userId || !projectId || !isOwner) return;
    const updated = await updateProjectCategory(
      projectId,
      editingId,
      { name: editName.trim(), emoji: editEmoji.trim() || undefined, isPurchase: editIsPurchase, isIncome: editIsIncome },
      userId
    );
    if (updated) {
      setEditingId(null);
      await refetch();
    }
  }

  async function confirmDelete() {
    if (!userId || !projectId || !categoryToDelete || !isOwner) return;
    const ok = await deleteProjectCategory(projectId, categoryToDelete, userId);
    if (ok) {
      if (editingId === categoryToDelete) setEditingId(null);
      setCategoryToDelete(null);
      await refetch();
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Project Categories</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {!projectId
          ? "Select a project to view and manage categories."
          : isOwner
            ? "Add and edit categories for this project. Only the project owner can make changes."
            : "View categories for this project. Only the project owner can add or edit."}
      </p>

      {!projectId && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          No project selected. Create or join a project first.
        </p>
      )}

      {/* Add new - owner only */}
      {projectId && isOwner && (
      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-medium">Add category</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            value={name}
            placeholder="Category name"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={emoji}
              placeholder="Emoji (optional)"
              onChange={(e) => setEmoji(e.target.value)}
            />
            <button
              type="button"
              aria-label="Choose emoji"
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-lg hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              onClick={() => setEmojiPickerFor("add")}
            >
              {emoji || "😀"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1" role="group" aria-label="Category type">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isPurchase
                  ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                  : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
              }`}
              onClick={() => setIsPurchase(true)}
            >
              Purchase
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !isPurchase
                  ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                  : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
              }`}
              onClick={() => setIsPurchase(false)}
            >
              Income
            </button>
          </div>
          <button type="button" className={`${btnPrimary} shrink-0`} onClick={onCreate}>
            Add category
          </button>
        </div>
      </section>
      )}

      {/* Purchase categories */}
      {projectId && (
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Purchase categories</h2>
        <ul className="space-y-2">
          {purchaseCategories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === c.id && isOwner ? (
                <>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      value={editName}
                      placeholder="Name"
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={editEmoji}
                        placeholder="Emoji"
                        onChange={(e) => setEditEmoji(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label="Choose emoji"
                        className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-lg hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        onClick={() => setEmojiPickerFor("edit")}
                      >
                        {editEmoji || "😀"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1" role="group" aria-label="Category type">
                      <button
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          editIsPurchase
                            ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                            : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                        }`}
                        onClick={() => {
                          setEditIsPurchase(true);
                          setEditIsIncome(false);
                        }}
                      >
                        Purchase
                      </button>
                      <button
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          editIsIncome
                            ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                            : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                        }`}
                        onClick={() => {
                          setEditIsPurchase(false);
                          setEditIsIncome(true);
                        }}
                      >
                        Income
                      </button>
                    </div>
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
                    {isOwner && (
                      <>
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
                      </>
                    )}
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
      )}

      {/* Income categories */}
      {projectId && (
      <section className="mt-6">
        <h2 className="mb-3 font-medium">Income categories</h2>
        <ul className="space-y-2">
          {incomeCategories.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === c.id && isOwner ? (
                <>
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className={inputClass}
                      value={editName}
                      placeholder="Name"
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        value={editEmoji}
                        placeholder="Emoji"
                        onChange={(e) => setEditEmoji(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label="Choose emoji"
                        className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-lg hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        onClick={() => setEmojiPickerFor("edit")}
                      >
                        {editEmoji || "😀"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1" role="group" aria-label="Category type">
                      <button
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          editIsPurchase
                            ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                            : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                        }`}
                        onClick={() => {
                          setEditIsPurchase(true);
                          setEditIsIncome(false);
                        }}
                      >
                        Purchase
                      </button>
                      <button
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          editIsIncome
                            ? "bg-[var(--primary)] text-primary-foreground shadow-sm"
                            : "border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
                        }`}
                        onClick={() => {
                          setEditIsPurchase(false);
                          setEditIsIncome(true);
                        }}
                      >
                        Income
                      </button>
                    </div>
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
                    {isOwner && (
                      <>
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
                      </>
                    )}
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
      )}

      {/* Emoji picker modal */}
      {emojiPickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose emoji"
          onClick={() => setEmojiPickerFor(null)}
        >
          <div
            className="max-h-[90vh] overflow-auto rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              open
              theme={typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(data) => {
                if (emojiPickerFor === "add") setEmoji(data.emoji);
                else setEditEmoji(data.emoji);
                setEmojiPickerFor(null);
              }}
              width={320}
              height={400}
            />
          </div>
        </div>
      )}

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
