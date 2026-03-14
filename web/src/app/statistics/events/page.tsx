import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DatePickerInput } from "@mantine/dates";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  deleteIncome,
  deletePurchase,
  loadCurrencies,
  saveIncome,
  savePurchase,
} from "@/lib/api/moneyActions";
import { loadProfileCategories } from "@/lib/api/profileService";
import { loadEventsList } from "@/lib/api/statistics";

type EventItem = {
  id?: string;
  name?: string;
  category?: string | { name?: string; id?: string };
  amount?: number;
  type?: string;
  /** ISO string or epoch seconds (number) - backend may serialize Instant either way */
  date?: string | number;
  currency?: string;
  userId?: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

/** Format Date as yyyy-MM-dd in local time (for API). Avoids UTC shift. */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

/** Backend may send date as ISO string or as epoch seconds (number). Format in user's local time. */
function formatDate(value?: string | number) {
  if (value === undefined || value === null) return "—";
  try {
    const d = toLocalDate(value);
    if (!d || Number.isNaN(d.getTime())) return "—";
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${date} ${time}`;
  } catch {
    return "—";
  }
}

/** Parse API date (epoch seconds or ISO string) to Date. */
function toLocalDate(value: string | number): Date {
  const d =
    typeof value === "number"
      ? new Date(value * 1000) // API often serializes Instant as epoch seconds
      : new Date(value);
  return d;
}

/** Format Date for datetime-local input (user's local YYYY-MM-DDTHH:mm). */
function toLocalDatetimeLocalString(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function getCategoryId(cat: EventItem["category"]): string {
  if (typeof cat === "object" && cat?.id) return cat.id;
  if (typeof cat === "string") return cat;
  return "";
}

type CategoryForDisplay = { id: string; name: string; emoji?: string | null };
/** Resolve category to display name. When backend sends only ID (string), use profileCategories to show name. */
function getCategoryDisplay(
  cat: EventItem["category"],
  profileCategories: CategoryForDisplay[] = []
): string {
  if (typeof cat === "object" && cat?.name) return cat.name;
  const id = typeof cat === "string" ? cat : typeof cat === "object" && cat?.id ? cat.id : "";
  if (!id) return "—";
  const found = profileCategories.find((c) => c.id === id);
  if (found) return found.emoji ? `${found.emoji} ${found.name}` : found.name;
  return "—";
}

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

const BATCH_SIZE = 10;

export default function StatisticsEventsPage() {
  const now = new Date();
  const [actions, setActions] = useState<EventItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [periodMode, setPeriodMode] = useState<"currentMonth" | "custom">("currentMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const [rangeValue, setRangeValue] = useState<[Date | null, Date | null]>([
    startOfCurrentMonth,
    todayNoon,
  ]);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editDate, setEditDate] = useState("");
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [saveStatus, setSaveStatus] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [swipeRevealedId, setSwipeRevealedId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const lastInitialLoadKeyRef = useRef<string | null>(null);
  const observerAttachedAtRef = useRef<number>(0);

  const userId = currentUserId();
  const projectId = currentProjectId();
  const canLoad = Boolean(userId && projectId);

  useEffect(() => {
    loadCurrencies().then((list) => {
      if (list?.length) setCurrencies(list);
    });
  }, []);

  const { data: profileCategories = [] } = useQuery({
    queryKey: ["profile-categories", userId],
    queryFn: () => loadProfileCategories(userId!),
    enabled: !!userId,
  });

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!userId || !projectId) return;
      const isFirstPage = offset === 0;
      if (isFirstPage && !append) setLoading(true);
      else setLoadingMore(true);
      try {
        const req: Parameters<typeof loadEventsList>[0] = {
          userId,
          projectId,
          limit: BATCH_SIZE,
          offset,
        };
        if (periodMode === "custom" && customFrom && customTo) {
          req.fromDate = customFrom;
          req.toDate = customTo;
        } else {
          const d = new Date();
          req.year = d.getFullYear();
          req.month = d.getMonth() + 1;
        }
        const res = await loadEventsList(req);
        const list = (res.actions ?? []) as EventItem[];
        setActions((prev) => (append ? [...prev, ...list] : list));
        setHasMore(res.hasMore ?? false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, projectId, periodMode, customFrom, customTo]
  );

  const periodKey = `${periodMode}-${customFrom}-${customTo}`;
  useEffect(() => {
    if (!canLoad) return;
    if (lastInitialLoadKeyRef.current === periodKey) return;
    lastInitialLoadKeyRef.current = periodKey;
    loadPage(0, false);
  }, [canLoad, periodKey, loadPage]);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    observerAttachedAtRef.current = Date.now();
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (Date.now() - observerAttachedAtRef.current < 400) return;
        loadPage(actions.length, true);
      },
      { rootMargin: "100px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, actions.length, loadPage]);

  const onRefresh = () => {
    loadPage(0, false);
  };

  const clearPeriod = () => {
    setPeriodMode("currentMonth");
    setCustomFrom("");
    setCustomTo("");
    setRangeValue([startOfCurrentMonth, todayNoon]);
  };

  const handleRangeChange = (value: [Date | null, Date | null]) => {
    setRangeValue(value);
    const [from, to] = value;
    if (from && to) {
      setCustomFrom(toLocalDateString(from));
      setCustomTo(toLocalDateString(to));
      setPeriodMode("custom");
    }
  };

  function fillEditFormFromEvent(event: EventItem) {
    setEditName(event.name ?? "");
    setEditCategory(getCategoryId(event.category));
    setEditAmount(event.amount !== undefined && event.amount !== null ? String(event.amount) : "");
    const c = event.currency ?? "USD";
    setEditCurrency(c);
    setCurrencies((prev) => (prev.includes(c) ? prev : [...prev, c].sort()));
    if (event.date !== undefined && event.date !== null) {
      try {
        const d = toLocalDate(event.date as string | number);
        setEditDate(toLocalDatetimeLocalString(d));
      } catch {
        setEditDate("");
      }
    } else {
      setEditDate("");
    }
    setSaveStatus("");
  }

  const openDetail = (event: EventItem, openInEditMode = false) => {
    setSelectedEvent(event);
    setEditMode(openInEditMode);
    setSwipeRevealedId(null);
    if (openInEditMode) {
      fillEditFormFromEvent(event);
    }
  };

  const closeDetail = () => {
    setSelectedEvent(null);
    setEditMode(false);
    setShowDeleteConfirm(false);
    setSaveStatus("");
    setDeleteError("");
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent?.id || !selectedEvent?.type || !userId || !projectId) return;
    setDeleteError("");
    const isIncome = selectedEvent.type === "income";
    const ok = isIncome
      ? await deleteIncome(userId, selectedEvent.id, projectId)
      : await deletePurchase(userId, selectedEvent.id, projectId);
    setShowDeleteConfirm(false);
    closeDetail();
    if (ok) {
      onRefresh();
    } else {
      setDeleteError("Could not delete: item not found or already removed.");
      onRefresh();
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent?.id || !selectedEvent?.type || !userId || !projectId) return;
    const name = editName.trim();
    if (!name) {
      setSaveStatus("Name is required");
      return;
    }
    const amount = Number(editAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setSaveStatus("Invalid amount");
      return;
    }
    const isIncome = selectedEvent.type === "income";
    const payload = {
      id: selectedEvent.id,
      category: (editCategory || profileCategories[0]?.id) ?? "",
      name,
      amount,
      currency: editCurrency,
      date: editDate ? new Date(editDate).toISOString() : new Date().toISOString(),
      isPrivate: false,
    };
    const ok = isIncome
      ? await saveIncome(userId, payload, projectId)
      : await savePurchase(userId, payload, projectId);
    setSaveStatus(ok ? "Saved" : "Failed");
    if (ok) {
      onRefresh();
      setTimeout(() => closeDetail(), 400);
    }
  };

  const categoriesForType = selectedEvent?.type === "income"
    ? profileCategories.filter((c) => c.isIncome).map((c) => ({ id: c.id, name: c.emoji ? `${c.emoji} ${c.name}` : c.name }))
    : profileCategories.filter((c) => c.isPurchase).map((c) => ({ id: c.id, name: c.emoji ? `${c.emoji} ${c.name}` : c.name }));

  const sections = (() => {
    const byDay = new Map<string, EventItem[]>();
    for (const event of actions) {
      try {
        const d = toLocalDate(event.date as string | number);
        if (Number.isNaN(d.getTime())) continue;
        const title = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
        if (!byDay.has(title)) byDay.set(title, []);
        byDay.get(title)!.push(event);
      } catch {
        // skip
      }
    }
    return Array.from(byDay.entries())
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => {
        const [dA, mA, yA] = a.title.split(".").map(Number);
        const [dB, mB, yB] = b.title.split(".").map(Number);
        if (yA !== yB) return yB - yA;
        if (mA !== mB) return mB - mA;
        return dB - dA;
      });
  })();

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-6 text-[var(--foreground)]">
      <header className="mb-4">
        <DatePickerInput
          type="range"
          placeholder="Pick period"
          value={rangeValue}
          onChange={handleRangeChange}
          disabled={loading}
          valueFormat="DD MMM YYYY"
          clearable
          onClear={clearPeriod}
          aria-label="Select date range"
          className="[&_.mantine-Input-input]:cursor-pointer [&_.mantine-Input-input]:text-center [&_.mantine-Input-input]:font-bold"
          styles={{
            input: {
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
            },
          }}
        />
      </header>

      {deleteError && (
        <p className="mb-2 text-sm text-amber-600" role="alert">
          {deleteError}
        </p>
      )}

      {loading && actions.length === 0 ? (
        <p className="text-sm opacity-80">Loading…</p>
      ) : sections.length === 0 ? (
        <p className="text-sm opacity-80">No money actions.</p>
      ) : (
        <ul className="space-y-6">
          {sections.map(({ title, data }) => (
            <li key={title}>
              <h2 className="mb-2 text-lg font-light text-[var(--foreground)]">{title}</h2>
              <ul className="space-y-2">
                {data.map((event) => {
                  const isIncome = event.type === "income";
                  const categoryName = getCategoryDisplay(event.category, profileCategories);
                  const amount = event.amount ?? 0;
                  const amountStr = (isIncome ? "+" : "-") + amount.toFixed(2) + "$";
                  const eventKey = event.id ?? `${event.name}-${amount}`;
                  const isSwipeRevealed = swipeRevealedId === eventKey;

                  return (
                    <li
                      key={eventKey}
                      className="relative overflow-hidden rounded border border-[var(--border)] bg-[var(--card)]"
                    >
                      {/* Swipe actions behind the row (revealed when row slides left) */}
                      <div className="absolute right-0 top-0 z-0 flex h-full w-[120px] items-center justify-end gap-1 border-l border-[var(--border)] bg-[var(--card)] pr-2">
                        <button
                          type="button"
                          aria-label="Edit"
                          className="flex rounded bg-[var(--primary)] p-2 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(event, true);
                          }}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove"
                          className="flex rounded bg-[var(--purchase)] p-2 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setSwipeRevealedId(null);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <div
                        className="relative z-10 flex w-full items-center justify-between bg-[var(--card)] px-3 py-2 transition-transform"
                        style={{
                          transform: isSwipeRevealed ? "translateX(-120px)" : "translateX(0)",
                        }}
                        onTouchStart={(e) => {
                          touchStartX.current = e.touches[0].clientX;
                        }}
                        onTouchEnd={(e) => {
                          const diff = touchStartX.current - e.changedTouches[0].clientX;
                          if (diff > 50) setSwipeRevealedId(eventKey);
                          else if (diff < -30) setSwipeRevealedId(null);
                        }}
                        onClick={() => {
                          if (isSwipeRevealed) setSwipeRevealedId(null);
                          else openDetail(event, false);
                        }}
                      >
                        <div className="min-w-0 flex-1 cursor-pointer">
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {hasMore && <div ref={loadMoreSentinelRef} className="h-4" aria-hidden />}
      {loadingMore && <p className="py-2 text-center text-sm opacity-70">Loading more…</p>}

      {/* Detail / Edit modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 py-4 sm:items-center sm:py-0"
          onClick={(e) => e.target === e.currentTarget && closeDetail()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
        >
          <div
            className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-t-2xl bg-[var(--card)] shadow-lg sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3 flex items-center gap-1">
              {!editMode && (
                <>
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      if (selectedEvent) fillEditFormFromEvent(selectedEvent);
                      setEditMode(true);
                    }}
                    className="rounded p-2 text-[var(--foreground)] opacity-80 hover:bg-[var(--border)] hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={handleDelete}
                    className="rounded p-2 text-[var(--purchase)] opacity-90 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-[var(--purchase)]"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closeDetail}
                className="rounded p-2 text-[var(--foreground)] opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 sm:pb-8">
            {editMode ? (
              <>
                <h2 id="detail-title" className="mb-4 pr-14 text-lg font-bold">Edit</h2>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-neutral-600">
                    Name
                    <input
                      className={`mt-1 ${inputClass}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-neutral-600">
                    Category
                    <select
                      className={`mt-1 ${inputClass}`}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {categoriesForType.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-neutral-600">
                    Amount
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={`mt-1 ${inputClass}`}
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-neutral-600">
                    Currency
                    <select
                      className={`mt-1 ${inputClass}`}
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-neutral-600">
                    Date
                    <input
                      type="datetime-local"
                      className={`mt-1 ${inputClass}`}
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </label>
                </div>
                {saveStatus && <p className="mt-2 text-sm opacity-80">{saveStatus}</p>}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 font-medium"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 font-medium text-white"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="detail-title" className="mb-4 pr-14 text-lg font-bold">
                  {selectedEvent.type === "income" ? "Income" : "Purchase"}
                </h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="opacity-70">Created by</dt>
                    <dd className="font-medium">
                      {selectedEvent.userId && selectedEvent.userId === userId
                        ? "You"
                        : selectedEvent.userId ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="opacity-70">Name</dt>
                    <dd className="font-medium">{selectedEvent.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="opacity-70">Category</dt>
                    <dd className="font-medium">{getCategoryDisplay(selectedEvent.category, profileCategories)}</dd>
                  </div>
                  <div>
                    <dt className="opacity-70">Amount</dt>
                    <dd className={selectedEvent.type === "income" ? "font-medium text-[var(--income)]" : "font-medium text-[var(--foreground)]"}>
                      {(selectedEvent.amount ?? 0).toFixed(2)} {selectedEvent.currency ?? "USD"}
                    </dd>
                  </div>
                  <div>
                    <dt className="opacity-70">Date</dt>
                    <dd className="font-medium">{formatDate(selectedEvent.date)}</dd>
                  </div>
                </dl>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && selectedEvent && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-[var(--card)] p-4 shadow-lg">
            <h3 id="confirm-title" className="text-lg font-bold">Remove</h3>
            <p className="mt-2 text-sm opacity-90">
              Are you sure you want to remove this {selectedEvent.type === "income" ? "income" : "purchase"}?
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 font-medium"
                onClick={() => setShowDeleteConfirm(false)}
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
      )}
    </main>
  );
}
