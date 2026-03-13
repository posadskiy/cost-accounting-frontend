import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserId } from "@/lib/api/auth";
import { loadProfileSettings, updateProfileSettings } from "@/lib/api/profileService";
import { loadCurrencies } from "@/lib/api/moneyActions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";

export default function SettingsGeneralPage() {
  const userId = currentUserId();
  const queryClient = useQueryClient();
  const [currencies, setCurrencies] = useState<string[]>(["USD"]);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!userId) return;
    loadProfileSettings(userId).then((settings) => {
      if (settings?.defaultCurrency) setDefaultCurrency(settings.defaultCurrency);
    });
  }, [userId]);

  useEffect(() => {
    loadCurrencies().then((list) => {
      if (list?.length) setCurrencies(list);
    });
  }, []);

  async function onSave() {
    if (!userId) return;
    setStatus("saving");
    const updated = await updateProfileSettings(userId, { defaultCurrency });
    if (updated) {
      setStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["profile-settings", userId] });
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <main className="mx-auto max-w-3xl bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Default preferences for new projects and the app.
      </p>

      <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-medium">Default project currency</h2>
        <p className="mb-3 text-sm text-neutral-600">
          This currency is used when creating a new project and as fallback where no project currency is set.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className={`${inputClass} max-w-[12rem]`}
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            aria-label="Default project currency"
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onSave}
            disabled={status === "saving"}
            className="rounded-lg bg-[var(--primary)] px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-70"
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
          </button>
        </div>
        {status === "error" && (
          <p className="mt-2 text-sm text-red-600">Failed to save. Try again.</p>
        )}
      </section>
    </main>
  );
}
