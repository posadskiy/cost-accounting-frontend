import { useLocation } from "react-router-dom";
import AppShell from "./AppShell";

const AUTH_PATHS = ["/login", "/register"];

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
