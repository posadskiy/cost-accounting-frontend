import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "@/lib/auth/tokenStore";

export default function RequireAuth() {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet />;
}
