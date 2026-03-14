import { useNavigate, useSearchParams } from "react-router-dom";
import { Login } from "auth-component-react";
import type { AuthResponse, RegisterResponse } from "auth-component-react";
import { login as costyLogin, setCurrentProjectId } from "@/lib/api/auth";
import { loadProfileSettings, runOnboarding } from "@/lib/api/profileService";

const DEFAULT_REDIRECT = "/";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  const authApi = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
      // Costy auth expects email; auth-component sends "username" — we use it as email
      const result = await costyLogin(username.trim().toLowerCase(), password);
      const token = result?.accessToken;
      if (!token) {
        throw new Error("Invalid email or password");
      }
      return {
        access_token: token,
        expires_in: 3600,
        userId: result.id,
      };
    },
  };

  const handleSuccess = async (response: AuthResponse | RegisterResponse) => {
    const userId = "userId" in response ? response.userId : null;
    if (userId) {
      try {
        const result = await runOnboarding(userId);
        if (result?.needsProjectSelection) {
          navigate("/project-selection");
          return;
        }
        const settings = await loadProfileSettings(userId);
        if (settings?.activeProjectId) {
          setCurrentProjectId(settings.activeProjectId);
        }
      } catch (e) {
        console.warn("Onboarding failed (defaults may still be created later):", e);
      }
    }
    const target = from && from.startsWith("/") && !from.startsWith("//") ? from : DEFAULT_REDIRECT;
    navigate(target);
  };

  const handleError = (error: Error) => {
    console.error("Login error:", error);
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Login
          authApi={authApi}
          onSuccess={handleSuccess}
          onError={handleError}
          onSwitchToRegister={() => navigate("/register")}
          title="Sign in"
          submitButtonText="Sign in"
          enableOAuth={false}
          showRegisterLink={true}
        />
      </div>
    </main>
  );
}
