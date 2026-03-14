import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentProjectId, currentUserId } from "@/lib/api/auth";
import {
  loadProjectInvites,
  createProjectInvite,
  revokeProjectInvite,
  loadProjectMembers,
  loadProjectsForUser,
} from "@/lib/api/profileService";
import type { ProjectInvite, ProjectMember } from "@/lib/api/profileService";

const buttonClass =
  "rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-70";

/** Backend may send Instant as ISO string or epoch seconds (number). JS Date expects ms, so seconds must be multiplied. */
function formatDate(s: string | number): string {
  try {
    const ms =
      typeof s === "number"
        ? s < 1e12
          ? s * 1000
          : s
        : typeof s === "string"
          ? Date.parse(s) || NaN
          : NaN;
    if (Number.isNaN(ms)) return String(s);
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(s);
  }
}

export default function SettingsInvitesPage() {
  const userId = currentUserId();
  const projectId = currentProjectId();
  const queryClient = useQueryClient();
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projects, setProjects] = useState<{ id: string; name?: string }[]>([]);
  const [effectiveProjectId, setEffectiveProjectId] = useState(projectId ?? "");
  const [isOwner, setIsOwner] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEffectiveProjectId(projectId ?? "");
  }, [projectId]);

  useEffect(() => {
    if (!userId) return;
    loadProjectsForUser(userId).then((list) => {
      setProjects(list);
      if (!projectId && list.length > 0) {
        setEffectiveProjectId(list[0].id);
      }
    });
  }, [userId, projectId]);

  useEffect(() => {
    if (!effectiveProjectId) {
      setInvites([]);
      setMembers([]);
      setIsOwner(false);
      return;
    }
    Promise.all([
      loadProjectInvites(effectiveProjectId, userId!),
      loadProjectMembers(effectiveProjectId),
    ]).then(([inviteList, memberList]) => {
      setInvites(inviteList);
      setMembers(memberList);
      const me = memberList.find((m) => m.userId === userId);
      setIsOwner(me?.role === "OWNER");
    });
  }, [userId, effectiveProjectId]);

  async function handleCreateInvite() {
    if (!effectiveProjectId || !userId || !isOwner) return;
    setError("");
    setCreating(true);
    setNewInviteCode(null);
    const result = await createProjectInvite(effectiveProjectId, {
      requesterUserId: userId,
      expiresInHours: 24,
      maxUses: 1,
    });
    setCreating(false);
    if (result?.code) {
      setNewInviteCode(result.code);
      const list = await loadProjectInvites(effectiveProjectId, userId);
      setInvites(list);
    } else {
      setError("Failed to create invite. Try again.");
    }
  }

  async function handleRevoke(inviteId: string) {
    if (!effectiveProjectId || !userId) return;
    setError("");
    setRevokingId(inviteId);
    const ok = await revokeProjectInvite(effectiveProjectId, inviteId, userId);
    setRevokingId(null);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["project-invites", effectiveProjectId] });
      setInvites((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, revoked: true } : i))
      );
    } else {
      setError("Failed to revoke invite. Try again.");
    }
  }

  async function handleCopyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  function membersWhoJoinedViaInvite(inviteId: string): ProjectMember[] {
    return members.filter((m) => m.joinedViaInviteId === inviteId);
  }

  const activeInvites = invites.filter((inv) => !inv.revoked);
  const historicalInvites = invites.filter((inv) => inv.usedCount >= 1);

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Invites</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Create invite codes for others to join this project. Only the owner can create and revoke invites.
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
        <p className="mt-6 text-sm text-neutral-500">Select a project above to manage invites.</p>
      )}

      {effectiveProjectId && isOwner && (
        <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-3 font-medium">Create invite</h2>
          <p className="mb-3 text-sm text-neutral-600">
            New code expires in 24 hours and can be used once. Share it only with people you trust.
            You can have up to 3 active invites at a time.
          </p>
          {activeInvites.length >= 3 && (
            <p className="mb-3 text-sm text-amber-700">
              You have 3 active invites. Revoke one or wait for it to expire to create another.
            </p>
          )}
          {newInviteCode && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1 rounded-lg bg-neutral-100 p-3 font-mono text-lg tracking-wider text-[var(--foreground)]">
                {newInviteCode}
              </div>
              <button
                type="button"
                onClick={() => handleCopyInviteCode(newInviteCode)}
                className={`${buttonClass} flex shrink-0 items-center gap-1.5 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}
                title="Copy invite code"
              >
                {copied ? (
                  "Copied!"
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleCreateInvite}
            disabled={creating || activeInvites.length >= 3}
            className={`${buttonClass} border-[var(--primary)] bg-[var(--primary)] text-white hover:opacity-90`}
          >
            {creating ? "Creating…" : "Generate invite code"}
          </button>
        </section>
      )}

      {effectiveProjectId && (
        <>
          <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="mb-3 font-medium">Active invites</h2>
            <p className="mb-3 text-sm text-neutral-500">
              Valid invite codes that can still be used. Revoked or expired invites are not listed here.
            </p>
            {activeInvites.length === 0 ? (
              <p className="text-sm text-neutral-500">No active invites.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {activeInvites.map((inv) => (
                  <li key={inv.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm text-neutral-600">
                        Created {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)} · Uses {inv.usedCount}/{inv.maxUses}
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.id)}
                          disabled={revokingId === inv.id}
                          className={`${buttonClass} border-red-200 bg-white text-red-700 hover:bg-red-50`}
                        >
                          {revokingId === inv.id ? "Revoking…" : "Revoke"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </section>

          <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="mb-3 font-medium">Historical</h2>
            <p className="mb-3 text-sm text-neutral-500">
              Invites that were used by at least one person to join this project.
            </p>
            {historicalInvites.length === 0 ? (
              <p className="text-sm text-neutral-500">No invites used yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {historicalInvites.map((inv) => {
                  const usedBy = membersWhoJoinedViaInvite(inv.id);
                  return (
                    <li key={inv.id} className="py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm text-neutral-600">
                          Created {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)} · Uses {inv.usedCount}/{inv.maxUses}
                          {inv.revoked && (
                            <span className="ml-1 font-medium text-amber-600">Revoked</span>
                          )}
                        </p>
                        {usedBy.length > 0 && (
                          <p className="mt-1 text-xs text-neutral-500">
                            Joined via this invite: {usedBy.map((m) => m.userId).join(", ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
