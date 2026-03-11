import { useNavigate } from "react-router-dom";
import { Register } from "auth-component-react";
import { endpoints } from "@/lib/config/endpoints";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/login");
  };

  const handleError = (error: Error) => {
    console.error("Registration error:", error);
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Register
          apiUrl={`${endpoints.userBaseUrl}/signup`}
          onSuccess={handleSuccess}
          onError={handleError}
          onSwitchToLogin={() => navigate("/login")}
          title="Create an account"
          submitButtonText="Register"
          enableOAuth={false}
          showLoginLink={true}
        />
      </div>
    </main>
  );
}
