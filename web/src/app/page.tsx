import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/statistics/events", { replace: true });
  }, [navigate]);
  return (
    <main className="flex min-h-[40vh] items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <p className="text-sm opacity-80">Loading…</p>
    </main>
  );
}
