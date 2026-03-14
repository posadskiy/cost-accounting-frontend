import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { currentProjectId, logout, currentUserId } from "@/lib/api/auth";
import { loadProjectMembers } from "@/lib/api/profileService";

const base =
  "block shrink-0 rounded-lg border border-[var(--border)] px-3 py-2.5 text-left text-sm font-medium transition-colors sm:w-full";
const activeClass =
  "border-[var(--primary)] bg-[var(--primary)] text-white";
const inactiveClass =
  "bg-[var(--card)] text-[var(--foreground)] opacity-90 hover:opacity-100 hover:border-[var(--primary)]/30";

export default function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const projectId = currentProjectId();
  const userId = currentUserId();

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => loadProjectMembers(projectId!),
    enabled: !!projectId,
  });

  const isProjectOwner = members.some((m) => m.userId === userId && m.role === "OWNER");

  const isProfile = path === "/settings/profile" || path === "/settings";
  const isCategories = path === "/settings/categories";
  const isLimits = path === "/settings/limits";
  const isGeneral = path === "/settings/general";
  const isMembers = path === "/settings/members";
  const isInvites = path === "/settings/invites";

  const buttonClass = (active: boolean) =>
    `${base} ${active ? activeClass : inactiveClass}`;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[var(--background)] sm:flex-row">
      <aside className="w-full shrink-0 border-b border-[var(--border)] bg-[var(--card)] sm:w-48 sm:border-b-0 sm:border-r sm:py-4">
        <nav
          className="flex flex-row gap-2 overflow-x-auto p-4 sm:flex-col sm:overflow-visible sm:p-3"
          aria-label="Settings"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <button
            type="button"
            onClick={() => navigate("/settings/profile")}
            className={buttonClass(isProfile)}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings/categories")}
            className={buttonClass(isCategories)}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings/limits")}
            className={buttonClass(isLimits)}
          >
            Limits
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings/general")}
            className={buttonClass(isGeneral)}
          >
            Settings
          </button>
          {isProjectOwner && (
            <button
              type="button"
              onClick={() => navigate("/settings/members")}
              className={buttonClass(isMembers)}
            >
              Members
            </button>
          )}
          {isProjectOwner && (
            <button
              type="button"
              onClick={() => navigate("/settings/invites")}
              className={buttonClass(isInvites)}
            >
              Invites
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={`${base} ${inactiveClass} mt-0 sm:mt-2`}
          >
            Logout
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
