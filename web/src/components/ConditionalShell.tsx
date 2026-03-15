import { useLocation } from "react-router-dom";
import AppShell from "./AppShell";

const AUTH_PATHS = ["/login", "/register"];
const ONBOARDING_PATH = "/project-selection";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isOnboardingPage =
    pathname === ONBOARDING_PATH || pathname.startsWith(ONBOARDING_PATH + "/");

  if (isAuthPage || isOnboardingPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
