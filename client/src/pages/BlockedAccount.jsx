import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function BlockedAccount() {
  const { axios, setIsBlocked } = useAppContext();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const checkNow = async () => {
    try {
      setChecking(true);
      // protected ping — succeeds only if backend no longer blocks this token
      await axios.get("/api/v1/users/user");
      // success => unblocked
      setIsBlocked(false);
      localStorage.removeItem("isBlocked");
      navigate("/", { replace: true });
    } catch {
      // still blocked or unauth — stay
    } finally {
      setChecking(false);
    }
  };

  // auto-retry every 5s so admin unblocks -> user exits automatically
  useEffect(() => {
    const t = setInterval(checkNow, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Account Blocked</h1>
        <p className="text-sm text-gray-600">
          Your account is currently blocked. Please contact support for assistance.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={checkNow}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {checking ? "Checking…" : "Try Again"}
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("isBlocked");
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
