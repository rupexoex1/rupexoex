import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const AppContext = createContext();

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // 🔑 Hydrate from localStorage synchronously (prevents first-render logout)
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u).role : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // 🔒 persisted blocked flag for UX guarding
  const [isBlocked, setIsBlocked] = useState(
    typeof window !== "undefined" && localStorage.getItem("isBlocked") === "1"
  );

  // rates
  const [basicPrice, setBasicPrice] = useState("91.50");
  const [vipPrice, setVipPrice] = useState("94.00");

  // plan limits
  const [basicMin, setBasicMin] = useState(100);
  const [basicMax, setBasicMax] = useState(5000);
  const [vipMin, setVipMin] = useState(5001);

  // balances / selections
  const [userBalance, setUserBalance] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  const fetchUserBalance = async () => {
    try {
      const res = await axios.get("/api/v1/users/balance");
      if (res.data.success) setUserBalance(res.data.balance);
    } catch (err) {
      console.error("Failed to fetch balance:", err?.message);
    }
  };

  const fetchPricesFromBackend = async () => {
    try {
      const res = await axios.get("/api/v1/users/rates");
      if (res.data) {
        setBasicPrice(res.data.basic);
        setVipPrice(res.data.vip);
        setBasicMin(Number(res.data.basicMin ?? 100));
        setBasicMax(Number(res.data.basicMax ?? 5000));
        setVipMin(Number(res.data.vipMin ?? 5001));
      }
    } catch (err) {
      console.error("Error fetching rates:", err?.message);
    }
  };

  // 🧰 bootstrap (token/role + initial fetches)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      // axios header turant set
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      const decoded = decodeJWT(storedToken);
      if (!role && decoded?.role) setRole(decoded.role);
    }

    if (storedUser && !role) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.role) setRole(parsed.role);
      } catch { }
    }

    Promise.all([fetchPricesFromBackend(), fetchUserBalance()]).finally(() =>
      setLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep axios auth header in sync when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Global interceptor:
  // - 403 ACCOUNT_BLOCKED → mark blocked + force /blocked
  // - any successful protected call → clear blocked flag
  // - 401 / specific 400 token errors (on authorized requests only) → force logout → /login
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (r) => {
        const hasAuth = !!r?.config?.headers?.Authorization;
        if (hasAuth && (isBlocked || localStorage.getItem("isBlocked") === "1")) {
          setIsBlocked(false);
          localStorage.removeItem("isBlocked");
        }
        return r;
      },
      (err) => {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        const msg = (err?.response?.data?.message || "").toLowerCase();

        // Blocked
        if (status === 403 && code === "ACCOUNT_BLOCKED") {
          setIsBlocked(true);
          localStorage.setItem("isBlocked", "1");
          if (window.location.pathname !== "/blocked") {
            window.location.replace("/blocked");
          }
          return Promise.reject(err);
        }

        // 🔐 Logout only if the failing request had Authorization header
        const isAuthRequest = !!err?.config?.headers?.Authorization;
        const tokenInvalid =
          isAuthRequest &&
          (status === 401 ||
            (status === 400 &&
              (msg.includes("token is not valid") || msg.includes("token"))));

        if (tokenInvalid) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("isBlocked");
          setToken(null);
          setRole(null);
          delete axios.defaults.headers.common["Authorization"];
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }

        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [isBlocked]);

  // If user becomes unblocked while on /blocked, kick them out
  useEffect(() => {
    if (!isBlocked && window.location.pathname === "/blocked") {
      navigate("/", { replace: true });
    }
  }, [isBlocked, navigate]);

  const value = {
    navigate,
    axios,
    token,
    setToken,
    role,
    setRole,
    loading,
    // blocked
    isBlocked,
    setIsBlocked,
    // rates
    basicPrice,
    vipPrice,
    setBasicPrice,
    setVipPrice,
    fetchPricesFromBackend,
    // limits
    basicMin,
    basicMax,
    vipMin,
    setBasicMin,
    setBasicMax,
    setVipMin,
    // balances
    userBalance,
    fetchUserBalance,
    // selections
    selectedPlan,
    setSelectedPlan,
    selectedBank,
    setSelectedBank,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
