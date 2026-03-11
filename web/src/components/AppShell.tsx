import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
