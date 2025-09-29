import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const AppContext = createContext();

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    console.error("Failed to decode JWT", err);
    return null;
  }
}

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // blocked state (UX guard)
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
      console.error("Failed to fetch balance:", err.message);
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
    } catch (error) {
      console.error("Error fetching rates:", error.message);
    }
  };

  // bootstrap (token/role + initial fetches)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      const decoded = decodeJWT(storedToken);
      if (decoded?.role) setRole(decoded.role);
    }
    if (!role && storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role) setRole(parsed.role);
    }

    fetchPricesFromBackend();
    fetchUserBalance();
    setLoading(false);
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

  // Global response interceptor:
  // - On 403 ACCOUNT_BLOCKED → mark blocked + hard redirect to /blocked
  // - On any successful protected call → clear blocked flag (if previously blocked)
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

        if (status === 403 && code === "ACCOUNT_BLOCKED") {
          setIsBlocked(true);
          localStorage.setItem("isBlocked", "1");
          if (window.location.pathname !== "/blocked") {
            window.location.replace("/blocked"); // harder lock than navigate()
          }
        }

        // Optional: auto-logout on 401
        // if (status === 401) {
        //   localStorage.removeItem("token");
        //   localStorage.removeItem("user");
        //   delete axios.defaults.headers.common["Authorization"];
        //   navigate("/login");
        // }

        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
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
