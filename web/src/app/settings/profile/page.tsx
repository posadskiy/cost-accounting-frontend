import { UserService } from "user-component-react";
import { currentUserId } from "@/lib/api/auth";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { endpoints } from "@/lib/config/endpoints";

export default function SettingsProfilePage() {
  const userId = currentUserId() ?? "";
  const bearerToken = getAccessToken();

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
        <p className="text-lg">Sign in to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="mb-4 text-2xl font-bold">Profile</h1>
      <UserService
        apiUrl={endpoints.userBaseUrl}
        userId="me"
        bearerToken={bearerToken}
        onError={(err) => console.error("Profile error:", err)}
        onSuccess={(msg) => console.log("Profile:", msg)}
      />
    </main>
  );
}
