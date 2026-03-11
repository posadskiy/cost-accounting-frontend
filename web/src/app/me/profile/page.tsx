import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserService } from "user-component-react";
import { currentUserId } from "@/lib/api/auth";
import { getAccessToken } from "@/lib/auth/tokenStore";
import { endpoints } from "@/lib/config/endpoints";
import axios from "axios";

export default function ProfilePage() {
  const userId = currentUserId() ?? "";

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return () => {
      delete axios.defaults.headers.common["Authorization"];
    };
  }, []);

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
        <p className="text-lg">Sign in to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="mb-4 text-2xl font-bold">My Profile</h1>
      <UserService
        apiUrl={endpoints.userBaseUrl}
        userId="me"
        onError={(err) => console.error("Profile error:", err)}
        onSuccess={(msg) => console.log("Profile:", msg)}
      />
      <Link
        to="/me/categories"
        className="mt-4 inline-block text-sm text-[var(--primary)] underline"
      >
        My Categories
      </Link>
    </main>
  );
}
