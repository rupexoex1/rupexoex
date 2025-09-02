import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios'
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

const AppContext = createContext();

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
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

  // rates
  const [basicPrice, setBasicPrice] = useState("91.50");
  const [vipPrice, setVipPrice] = useState("94.00");

  // plan limits (NEW: dynamic)
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
      if (res.data.success) {
        setUserBalance(res.data.balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err.message);
    }
  };

  const fetchPricesFromBackend = async () => {
    try {
      const res = await axios.get("/api/v1/users/rates");
      if (res.data) {
        // rates
        setBasicPrice(res.data.basic);
        setVipPrice(res.data.vip);

        // limits (with safe defaults)
        setBasicMin(Number(res.data.basicMin ?? 100));
        setBasicMax(Number(res.data.basicMax ?? 5000));
        setVipMin(Number(res.data.vipMin ?? 5001));
      }
    } catch (error) {
      console.error("Error fetching rates:", error.message);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      const decoded = decodeJWT(storedToken);
      if (decoded?.role) setRole(decoded.role);
    }
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setRole(parsed?.role || null);
    }
    fetchPricesFromBackend();
    fetchUserBalance();
    setLoading(false);
  }, [])

  const value = {
    navigate, axios, token, setToken, role, setRole, loading,
    // rates
    basicPrice, vipPrice, setBasicPrice, setVipPrice, fetchPricesFromBackend,
    // limits
    basicMin, basicMax, vipMin, setBasicMin, setBasicMax, setVipMin,
    // balances
    userBalance, fetchUserBalance,
    // selections
    selectedPlan, setSelectedPlan, selectedBank, setSelectedBank
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
