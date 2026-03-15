import { useEffect, useMemo, useRef, useState } from "react";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  loadCurrencies,
  normalizeParticipants,
  saveIncome,
  savePurchase,
  saveSplitIncome,
  saveSplitPurchase,
} from "@/lib/api/moneyActions";
import { loadProjectCategories, loadProfileSettings, loadProjectsForUser, loadUsernames } from "@/lib/api/profileService";
import { loadProjectUsers, ProjectUser } from "@/lib/api/user";

type Mode = "purchase" | "income";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

function computeSplitAmounts(
  total: number,
  participantIds: string[],
  amountOverrides: Record<string, number>
): number[] {
  if (participantIds.length === 0) return [];
  const overriddenIds = Object.keys(amountOverrides).filter((id) => participantIds.includes(id));
  const fixedSum = overriddenIds.reduce((s, id) => s + (amountOverrides[id] ?? 0), 0);
  const autoCount = participantIds.length - overriddenIds.length;
  const remainder = total - fixedSum;
  const autoAmount = autoCount > 0 && remainder >= 0 ? remainder / autoCount : 0;
  const amounts = participantIds.map((id) =>
    amountOverrides[id] !== undefined ? amountOverrides[id]! : autoAmount
  );
  return amounts;
}

function ensureSumToTotal(amounts: number[], total: number): number[] {
  if (amounts.length === 0) return [];
  const rounded = amounts.map((a) => Number(a.toFixed(2)));
  const sum = rounded.reduce((s, a) => s + a, 0);
  rounded[rounded.length - 1] = Number((total - sum + rounded[rounded.length - 1]!).toFixed(2));
  return rounded;
}

export default function AddPage() {
  const [mode, setMode] = useState<Mode>("purchase");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [amountOverrides, setAmountOverrides] = useState<Record<string, number>>({});
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [status, setStatus] = useState("");

  const userId = currentUserId();
  const projectId = currentProjectId();
  const prevModeRef = useRef<Mode>(mode);

  // Clear form fields when switching between Purchase and Income
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setName("");
      setAmount("");
      setSplitEnabled(false);
      setSelectedParticipantIds([]);
      setAmountOverrides({});
      setEditingParticipantId(null);
      setEditingValue("");
      setStatus("");
    }
  }, [mode]);

  const otherIds = splitEnabled ? selectedParticipantIds : [];
  const participantIds = useMemo(
    () => (userId ? normalizeParticipants(userId, otherIds) : []),
    [userId, otherIds.join(",")]
  );
  const participantList = useMemo(() => {
    const getName = (id: string) =>
      id === userId ? "Me" : usernames[id] ?? projectUsers.find((u) => u.id === id)?.name?.trim() ?? projectUsers.find((u) => u.id === id)?.email?.trim() ?? id;
    return participantIds.map((id) => ({ id, name: getName(id) }));
  }, [participantIds, userId, projectUsers, usernames]);

  const totalAmount = Number(amount || "0") || 0;
  const splitAmounts = useMemo(
    () => computeSplitAmounts(totalAmount, participantIds, amountOverrides),
    [totalAmount, participantIds, amountOverrides]
  );
  const overridesSum = Object.keys(amountOverrides)
    .filter((id) => participantIds.includes(id))
    .reduce((s, id) => s + (amountOverrides[id] ?? 0), 0);
  const splitError =
    totalAmount > 0 &&
    (overridesSum > totalAmount + 0.01 || (splitAmounts.length > 0 && splitAmounts.some((a) => a < 0)));

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [projectCats, curr, profileSettings, projects] = await Promise.all([
        projectId ? loadProjectCategories(projectId) : Promise.resolve([]),
        loadCurrencies(),
        loadProfileSettings(userId),
        loadProjectsForUser(userId),
      ]);
      setCurrencies(curr);
      const project = projectId ? projects.find((p) => p.id === projectId) : undefined;
      const defaultCurrency =
        project?.currency ?? profileSettings?.defaultCurrency ?? "USD";
      setCurrency((prev) =>
        curr.includes(defaultCurrency) ? defaultCurrency : curr.includes(prev) ? prev : curr[0] ?? "USD"
      );
      const filtered = projectCats
        .filter((c) => (mode === "purchase" ? c.isPurchase : c.isIncome))
        .map((c) => ({ id: c.id, name: c.emoji ? `${c.emoji} ${c.name}` : c.name }));
      setCategories(filtered);
      if (filtered[0]?.id) setCategory(filtered[0].id);
    }
    load();
  }, [userId, mode, projectId]);

  useEffect(() => {
    if (!projectId) {
      setProjectUsers([]);
      setUsernames({});
      return;
    }
    async function loadUsers() {
      const users = await loadProjectUsers(projectId);
      const list = users.filter((user) => user.id && user.id !== userId);
      setProjectUsers(list);
      const ids = list.map((u) => u.id).filter(Boolean);
      if (ids.length > 0) {
        loadUsernames(ids).then(setUsernames);
      } else {
        setUsernames({});
      }
    }
    loadUsers();
  }, [projectId, userId]);

  // When only two users in project, auto-select the other user when split is enabled
  const twoUsersOnly = projectUsers.length === 1;
  useEffect(() => {
    if (twoUsersOnly && splitEnabled && projectUsers[0]?.id) {
      setSelectedParticipantIds((prev) =>
        prev.length === 1 && prev[0] === projectUsers[0].id ? prev : [projectUsers[0].id]
      );
    }
  }, [twoUsersOnly, splitEnabled, projectUsers]);

  useEffect(() => {
    setAmountOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (!participantIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [participantIds.join(",")]);

  function commitParticipantAmount(participantId: string, raw: string) {
    const trimmed = raw.trim();
    const n = trimmed === "" ? 0 : Number(trimmed);
    if (Number.isNaN(n) || n < 0) {
      setAmountOverrides((prev) => ({ ...prev, [participantId]: 0 }));
    } else {
      setAmountOverrides((prev) => ({ ...prev, [participantId]: n }));
    }
    setEditingParticipantId(null);
    setEditingValue("");
  }

  async function onSave() {
    if (!name.trim()) {
      setStatus("Name is required");
      return;
    }
    if (totalAmount <= 0) {
      setStatus("Amount must be greater than 0");
      return;
    }
    if (participantIds.length > 0 && splitError) {
      setStatus("Split amounts must be non-negative and total must not exceed the amount.");
      return;
    }
    const payload = {
      category,
      name,
      amount: totalAmount,
      currency,
      date: new Date().toISOString(),
      isPrivate: false,
    };
    if (!userId || !projectId) {
      setStatus("Sign in and select a project to add entries.");
      return;
    }
    if (participantIds.length > 0) {
      const amounts = ensureSumToTotal(splitAmounts, totalAmount);
      const ok =
        mode === "purchase"
          ? await saveSplitPurchase(userId, otherIds, payload, projectId, amounts)
          : await saveSplitIncome(userId, otherIds, payload, projectId, amounts);
      setStatus(ok ? "Saved" : "Failed");
    } else {
      const ok =
        mode === "purchase"
          ? await savePurchase(userId, payload, projectId)
          : await saveIncome(userId, payload, projectId);
      setStatus(ok ? "Saved" : "Failed");
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Add</h1>

      <div className="mt-4 flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
        <button
          type="button"
          onClick={() => setMode("purchase")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "purchase"
              ? "bg-[var(--purchase)] text-white"
              : "text-[var(--foreground)] opacity-80 hover:opacity-100"
          }`}
        >
          Purchase
        </button>
        <button
          type="button"
          onClick={() => setMode("income")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "income"
              ? "bg-[var(--income)] text-white"
              : "text-[var(--foreground)] opacity-80 hover:opacity-100"
          }`}
        >
          Income
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Amount
          <input
            className={inputClass}
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Name
          <input
            className={inputClass}
            placeholder={mode === "purchase" ? "e.g. Groceries" : "e.g. Salary"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Category
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Currency
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        {projectUsers.length > 0 && (
          <>
        <label htmlFor="split-switch" className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-neutral-600">
          <span>Split</span>
          <button
            id="split-switch"
            type="button"
            role="switch"
            aria-checked={splitEnabled}
            onClick={() => setSplitEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
              splitEnabled ? "bg-[var(--primary)]" : "bg-neutral-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                splitEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
        {splitEnabled && !twoUsersOnly && (
          <div className="rounded border border-[var(--border)] bg-[var(--card)] p-3">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Available users</p>
            <div className="grid gap-2">
              {projectUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedParticipantIds.includes(user.id)}
                    onChange={(e) =>
                      setSelectedParticipantIds((prev) =>
                        e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                      )
                    }
                  />
                  {user.name?.trim() || user.email?.trim() || user.id}
                </label>
              ))}
            </div>
          </div>
        )}
        {participantList.length > 1 && (
          <div className="rounded border border-[var(--border)] bg-[var(--card)] p-3">
            <p className="mb-2 text-sm font-medium">Amount per person (editable, remainder split equally)</p>
            {splitError && (
              <p className="mb-2 text-sm text-[var(--purchase)]">
                Amounts must be non-negative and the total of custom amounts must not exceed {totalAmount.toFixed(2)} {currency}.
              </p>
            )}
            <ul className="space-y-2">
              {participantList.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="min-w-[6rem] truncate text-sm font-medium">{p.name}</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className={`flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                      splitAmounts[i] !== undefined && splitAmounts[i]! < 0 ? "border-[var(--purchase)]" : ""
                    }`}
                    value={
                      editingParticipantId === p.id
                        ? editingValue
                        : amountOverrides[p.id] !== undefined
                          ? String(amountOverrides[p.id])
                          : (splitAmounts[i]?.toFixed(2) ?? "")
                    }
                    onFocus={() => {
                      setEditingParticipantId(p.id);
                      setEditingValue(
                        amountOverrides[p.id] !== undefined
                          ? String(amountOverrides[p.id])
                          : (splitAmounts[i]?.toFixed(2) ?? "")
                      );
                    }}
                    onChange={(e) => {
                      if (editingParticipantId === p.id) setEditingValue(e.target.value);
                    }}
                    onBlur={() => {
                      if (editingParticipantId === p.id) commitParticipantAmount(p.id, editingValue);
                    }}
                  />
                  <span className="shrink-0 text-sm opacity-70">{currency}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-70">
              Total: {splitAmounts.reduce((s, a) => s + a, 0).toFixed(2)} {currency}
              {totalAmount > 0 && Math.abs(splitAmounts.reduce((s, a) => s + a, 0) - totalAmount) > 0.01 && (
                <span className="text-[var(--purchase)]"> (should be {totalAmount.toFixed(2)})</span>
              )}
            </p>
          </div>
        )}
          </>
        )}
        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          onClick={onSave}
        >
          {mode === "purchase" ? "Save Purchase" : "Save Income"}
        </button>
      </div>
      {status && <p className="mt-3 text-sm opacity-80">{status}</p>}
    </main>
  );
}
