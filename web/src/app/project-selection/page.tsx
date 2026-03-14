import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { currentUserId, setCurrentProjectId } from "@/lib/api/auth";
import { createProject, joinProjectByCode } from "@/lib/api/profileService";
import { loadCurrencies as loadCurrencyList } from "@/lib/api/moneyActions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

export default function ProjectSelectionPage() {
  const navigate = useNavigate();
  const userId = currentUserId();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [createName, setCreateName] = useState("Family budget");
  const [createCurrency, setCreateCurrency] = useState("USD");
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCurrencyList().then((list) => {
      if (list?.length) setCurrencies(list);
    });
  }, []);

  async function handleCreate() {
    if (!userId) return;
    setStatus("loading");
    setErrorMessage("");
    const project = await createProject({
      ownerUserId: userId,
      name: createName.trim() || "Family budget",
      currency: createCurrency,
    });
    if (project) {
      setCurrentProjectId(project.id);
      navigate("/", { replace: true });
    } else {
      setStatus("error");
      setErrorMessage("Failed to create project. Try again.");
    }
  }

  async function handleJoin() {
    if (!userId || !joinCode.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    const result = await joinProjectByCode({
      userId,
      code: joinCode.trim().toUpperCase(),
    });
    if (result?.projectId) {
      setCurrentProjectId(result.projectId);
      navigate("/", { replace: true });
    } else {
      setStatus("error");
      setErrorMessage("Invalid or expired code. Check the code and try again.");
    }
  }

  if (!userId) {
    navigate("/login");
    return null;
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          Get started
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create a new project or join one with an invite code.
        </p>

        {mode === "choose" && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="w-full rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            >
              Create a project
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            >
              Join with invite code
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Project name
              </label>
              <input
                type="text"
                className={inputClass}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Family budget"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Currency
              </label>
              <select
                className={inputClass}
                value={createCurrency}
                onChange={(e) => setCreateCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 font-medium text-[var(--foreground)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={status === "loading"}
                className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-70"
              >
                {status === "loading" ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Invite code
              </label>
              <input
                type="text"
                className={inputClass}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. ABCD1234"
                maxLength={20}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-neutral-500">
                8-character code from the project owner.
              </p>
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 font-medium text-[var(--foreground)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={status === "loading" || !joinCode.trim()}
                className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-70"
              >
                {status === "loading" ? "Joining…" : "Join"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
