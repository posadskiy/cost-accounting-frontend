import { useEffect, useState } from "react";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  loadCurrencies,
  parseParticipantIds,
  saveIncome,
  saveSplitIncome,
  splitAmountPerParticipant,
} from "@/lib/api/moneyActions";
import { loadProfileCategories } from "@/lib/api/profileService";
import { loadProjectUsers, ProjectUser } from "@/lib/api/user";

export default function NewIncomePage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [splitWith, setSplitWith] = useState("");
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const userId = currentUserId();
  const projectId = currentProjectId();

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [profileCats, curr] = await Promise.all([
        loadProfileCategories(userId),
        loadCurrencies(),
      ]);
      const incomeCats = profileCats
        .filter((c) => c.isIncome)
        .map((c) => ({ id: c.id, name: c.emoji ? `${c.emoji} ${c.name}` : c.name }));
      setCategories(incomeCats);
      setCurrencies(curr);
      if (incomeCats[0]?.id) setCategory(incomeCats[0].id);
      if (curr[0]) setCurrency(curr[0]);
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!projectId) {
      setProjectUsers([]);
      return;
    }
    async function loadUsers() {
      const users = await loadProjectUsers(projectId);
      setProjectUsers(users.filter((user) => user.id && user.id !== userId));
    }
    loadUsers();
  }, [projectId, userId]);

  const participants = [...new Set([...selectedParticipantIds, ...parseParticipantIds(splitWith)])];
  const totalParticipants = 1 + participants.length;
  const splitPreview = splitAmountPerParticipant(Number(amount || "0"), totalParticipants);

  async function onSave() {
    if (!userId || !projectId) {
      setStatus("Sign in and select a project to add entries.");
      return;
    }
    if (Number(amount || "0") <= 0) {
      setStatus("Amount must be greater than 0");
      return;
    }
    const payload = {
      category,
      name,
      amount: Number(amount || "0"),
      currency,
      date: new Date().toISOString(),
      isPrivate: false,
    };
    const ok = participants.length > 0
      ? await saveSplitIncome(userId, participants, payload, projectId)
      : await saveIncome(userId, payload, projectId);
    setStatus(ok ? "Saved" : "Failed");
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";
  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Add Income</h1>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Category
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Name
          <input className={inputClass} placeholder="e.g. Salary" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Amount
          <input className={inputClass} type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
        <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-600">
          Split (optional)
          <input
            className={inputClass}
            placeholder="User IDs comma-separated, or use checkboxes below"
            value={splitWith}
            onChange={(e) => setSplitWith(e.target.value)}
          />
        </label>
        <div className="rounded border border-[var(--border)] p-3">
          <p className="mb-2 text-sm font-medium">Split with project users</p>
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
        {participants.length > 0 && (
          <p className="text-sm opacity-80">
            Split preview: {totalParticipants} participants, {splitPreview.toFixed(2)} {currency} each.
          </p>
        )}
          </>
        )}
        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          onClick={onSave}
        >
          Save Income
        </button>
      </div>
      {status && <p className="mt-3 text-sm opacity-80">{status}</p>}
    </main>
  );
}
