import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  loadProjectMembers,
  removeProjectMember,
  loadProjectsForUser,
} from "@/lib/api/profileService";
import type { ProjectMember } from "@/lib/api/profileService";

const buttonClass =
  "rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-70";

export default function SettingsMembersPage() {
  const userId = currentUserId();
  const projectId = currentProjectId();
  const queryClient = useQueryClient();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projects, setProjects] = useState<{ id: string; name?: string }[]>([]);
  const [effectiveProjectId, setEffectiveProjectId] = useState(projectId ?? "");
  const [isOwner, setIsOwner] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setEffectiveProjectId(projectId ?? "");
  }, [projectId]);

  useEffect(() => {
    if (!userId) return;
    loadProjectsForUser(userId).then(setProjects);
  }, [userId]);

  useEffect(() => {
    if (!effectiveProjectId) {
      setMembers([]);
      setIsOwner(false);
      return;
    }
    loadProjectMembers(effectiveProjectId).then((list) => {
      setMembers(list);
      const me = list.find((m) => m.userId === userId);
      setIsOwner(me?.role === "OWNER");
    });
  }, [userId, effectiveProjectId]);

  async function handleRemove(memberUserId: string) {
    if (!effectiveProjectId || !userId || !isOwner) return;
    setError("");
    setRemovingId(memberUserId);
    const ok = await removeProjectMember(effectiveProjectId, memberUserId, userId);
    setRemovingId(null);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["project-members", effectiveProjectId] });
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
    } else {
      setError("Failed to remove member. Try again.");
    }
  }

  const currentProject = projects.find((p) => p.id === effectiveProjectId);

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Members</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage who has access to the current project. Only the project owner can remove members.
      </p>

      {projects.length > 0 && (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-neutral-600">
            Current project
          </label>
          <select
            className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            value={effectiveProjectId}
            onChange={(e) => setEffectiveProjectId(e.target.value)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {!effectiveProjectId && (
        <p className="mt-6 text-sm text-neutral-500">Select a project above to manage members.</p>
      )}

      {effectiveProjectId && (
        <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-3 font-medium">Project members</h2>
          {members.length === 0 ? (
            <p className="text-sm text-neutral-500">No members in this project.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {members.map((m) => (
                <li
                  key={m.userId ?? ""}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-medium">{m.userId ?? "—"}</span>
                    <span className="ml-2 text-sm text-neutral-500">
                      {m.role === "OWNER" ? "Owner" : "Member"}
                    </span>
                  </div>
                  {isOwner && m.role !== "OWNER" && m.userId !== userId && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.userId!)}
                      disabled={removingId === m.userId}
                      className={`${buttonClass} border-red-200 bg-white text-red-700 hover:bg-red-50`}
                    >
                      {removingId === m.userId ? "Removing…" : "Remove"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      )}
    </main>
  );
}
