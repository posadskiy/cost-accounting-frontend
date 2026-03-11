import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "@/lib/api/auth";

const tabs = [
  { href: "/statistics/events", label: "Statistics" },
  { href: "/statistics/chart", label: "Chart" },
  { href: "/purchase/new", label: "Purchase" },
  { href: "/income/new", label: "Income" },
  { href: "/me/profile", label: "Profile" },
] as const;

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Main"
    >
      <ul className="flex items-center justify-around py-2">
        {tabs.map(({ href, label }) => {
          const active = pathname === href || (href !== "/me/profile" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                to={href}
                className={`block px-3 py-1.5 text-center text-sm font-medium ${
                  active ? "text-[var(--primary)]" : "text-[var(--foreground)] opacity-80"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="block px-3 py-1.5 text-center text-sm font-medium text-[var(--foreground)] opacity-80 hover:opacity-100"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}
