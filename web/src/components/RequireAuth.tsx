import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { currentUserId, setCurrentProjectId } from "@/lib/api/auth";
import { loadProfileSettings } from "@/lib/api/profileService";

export default function RequireAuth() {
  const location = useLocation();
  const pathname = location.pathname;
  const token = getAccessToken();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    const uid = currentUserId();
    if (!uid) {
      setOnboarded(true);
      return;
    }
    loadProfileSettings(uid).then((settings) => {
      if (settings?.activeProjectId) setCurrentProjectId(settings.activeProjectId);
      const ob = settings?.onboarded ?? (settings?.activeProjectId != null && settings?.activeProjectId !== "");
      setOnboarded(ob);
    }).catch(() => setOnboarded(true));
  }, [token]);

  if (!token) {
    const from = pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  if (onboarded === null) {
    return null;
  }

  if (!onboarded && pathname !== "/project-selection") {
    return <Navigate to="/project-selection" replace />;
  }

  return <Outlet />;
}
