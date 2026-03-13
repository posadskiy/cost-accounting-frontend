import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentProjectId, currentUserId, setCurrentProjectId } from "@/lib/api/auth";
import {
  loadProfileSettings,
  loadProjectsForUser,
  loadProjectMembers,
  setActiveProject,
  updateProfileSettings,
  updateProjectCurrency,
} from "@/lib/api/profileService";
import type { Project } from "@/lib/api/profileService";
import { loadCurrencies } from "@/lib/api/moneyActions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

export default function SettingsGeneralPage() {
  const userId = currentUserId();
  const projectIdFromSession = currentProjectId();
  const queryClient = useQueryClient();
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [projects, setProjects] = useState<Project[]>([]);
  const [effectiveProjectId, setEffectiveProjectId] = useState(projectIdFromSession ?? "");
  const [projectCurrency, setProjectCurrency] = useState("");
  const [projectStatus, setProjectStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isOwner, setIsOwner] = useState(false);
  const [projectCurrencyDirty, setProjectCurrencyDirty] = useState("");

  useEffect(() => {
    setEffectiveProjectId(projectIdFromSession ?? "");
  }, [projectIdFromSession]);

  useEffect(() => {
    if (!userId) return;
    loadProfileSettings(userId).then((settings) => {
      if (settings?.defaultCurrency) setDefaultCurrency(settings.defaultCurrency);
    });
  }, [userId]);

  useEffect(() => {
    loadCurrencies().then((list) => {
      if (list?.length) setCurrencies(list);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadProjectsForUser(userId).then(setProjects);
  }, [userId]);

  useEffect(() => {
    if (!userId || !effectiveProjectId) {
      setProjectCurrency("");
      setProjectCurrencyDirty("");
      setIsOwner(false);
      return;
    }
    Promise.all([loadProjectsForUser(userId), loadProjectMembers(effectiveProjectId)]).then(
      ([projectList, members]) => {
        const project = projectList.find((p) => p.id === effectiveProjectId);
        const myMember = members.find((m) => m.userId === userId);
        const role = myMember?.role ?? "";
        setIsOwner(role === "OWNER");
        const curr = project?.currency ?? "";
        setProjectCurrency(curr);
        setProjectCurrencyDirty(curr);
      }
    );
  }, [userId, effectiveProjectId]);

  async function onSelectProject(projectId: string) {
    if (!userId || !projectId) return;
    setCurrentProjectId(projectId);
    setEffectiveProjectId(projectId);
    await setActiveProject(userId, projectId);
    queryClient.invalidateQueries({ queryKey: ["profile-settings", userId] });
  }

  async function onSaveProfile() {
    if (!userId) return;
    setProfileStatus("saving");
    const updated = await updateProfileSettings(userId, { defaultCurrency });
    if (updated) {
      setProfileStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["profile-settings", userId] });
      setTimeout(() => setProfileStatus("idle"), 2000);
    } else {
      setProfileStatus("error");
      setTimeout(() => setProfileStatus("idle"), 3000);
    }
  }

  async function onSaveProjectCurrency() {
    if (!userId || !effectiveProjectId || !projectCurrencyDirty.trim()) return;
    setProjectStatus("saving");
    const updated = await updateProjectCurrency(effectiveProjectId, userId, projectCurrencyDirty.trim());
    if (updated) {
      setProjectCurrency(updated.currency ?? projectCurrencyDirty);
      setProjectCurrencyDirty(updated.currency ?? projectCurrencyDirty);
      setProjectStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["projects", userId] });
      setTimeout(() => setProjectStatus("idle"), 2000);
    } else {
      setProjectStatus("error");
      setTimeout(() => setProjectStatus("idle"), 3000);
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Your preferences and project settings.
      </p>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-medium">My default currency</h2>
        <p className="mb-3 text-sm text-neutral-600">
          Used when creating a new project and as your preferred currency (e.g. when travelling and
          you want to use USD temporarily while the project is in EUR).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className={`${inputClass} max-w-[12rem]`}
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            aria-label="My default currency"
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onSaveProfile}
            disabled={profileStatus === "saving"}
            className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-70"
          >
            {profileStatus === "saving" ? "Saving…" : profileStatus === "saved" ? "Saved" : "Save"}
          </button>
        </div>
        {profileStatus === "error" && (
          <p className="mt-2 text-sm text-red-600">Failed to save. Try again.</p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-medium">Project currency</h2>
        <p className="mb-3 text-sm text-neutral-600">
          Default currency for the current project. Only the project owner can change it. New
          entries in this project default to this currency. Useful when you move to another
          country, relocate, or need to track spending in a different currency.
        </p>
        {projects.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-neutral-600">Current project:</label>
              <select
                className={`${inputClass} max-w-[16rem]`}
                value={effectiveProjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) onSelectProject(id);
                }}
                aria-label="Select current project"
              >
                <option value="">Select a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.id} {p.currency ? `(${p.currency})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {effectiveProjectId ? (
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className={`${inputClass} max-w-[12rem]`}
                  value={projectCurrencyDirty}
                  onChange={(e) => setProjectCurrencyDirty(e.target.value)}
                  disabled={!isOwner}
                  aria-label="Project currency"
                >
                  {currencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                {isOwner ? (
                  <button
                    type="button"
                    onClick={onSaveProjectCurrency}
                    disabled={
                      projectStatus === "saving" || projectCurrencyDirty === projectCurrency
                    }
                    className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-70"
                  >
                    {projectStatus === "saving"
                      ? "Saving…"
                      : projectStatus === "saved"
                        ? "Saved"
                        : "Save"}
                  </button>
                ) : (
                  <span className="text-sm text-neutral-500">Only the project owner can change this.</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Choose a project above to view or change its currency.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500">You have no projects yet. Create one to set its currency.</p>
        )}
        {projectStatus === "error" && (
          <p className="mt-2 text-sm text-red-600">Failed to save project currency. Try again.</p>
        )}
      </section>
    </main>
  );
}
