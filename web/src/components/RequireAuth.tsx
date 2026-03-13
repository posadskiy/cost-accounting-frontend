import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { currentUserId, setCurrentProjectId } from "@/lib/api/auth";
import { loadProfileSettings } from "@/lib/api/profileService";

export default function RequireAuth() {
  const location = useLocation();
  const token = getAccessToken();

  useEffect(() => {
    if (!token) return;
    const pid = typeof window !== "undefined" ? sessionStorage.getItem("costy_project_id") : null;
    if (pid) return;
    const uid = currentUserId();
    if (!uid) return;
    loadProfileSettings(uid).then((settings) => {
      if (settings?.activeProjectId) setCurrentProjectId(settings.activeProjectId);
    });
  }, [token]);

  if (!token) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet />;
}
