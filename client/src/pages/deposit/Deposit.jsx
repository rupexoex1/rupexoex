import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DepositQRCode from "./DepositQRCode";
import { useAppContext } from "../../context/AppContext";

const Deposit = () => {
  const { axios, token } = useAppContext();
  const [address, setAddress] = useState("");
  const [mode, setMode] = useState("manual"); // default manual
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // per-user wallet (fallback for auto mode)
  const perUserAddress = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      return storedUser?.tronWallet?.address || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // NOTE: /check-deposit manual mode me sirf master wallet return karta hai.
    // Auto mode me yeh chain check/forward bhi trigger karta hai — abhi hum manual pe hain.
    const fetchAddress = async () => {
      try {
        if (!token) {
          // route aapki app me public hai, lekin backend endpoint auth maangta hai
          // is liye token na ho to per-user local fallback nahi hoga — login karwa do.
          setErr("Please log in to view deposit address.");
          return;
        }

        const res = await axios.post("/api/v1/users/check-deposit");
        if (!mounted) return;

        if (res?.data?.mode === "manual") {
          setMode("manual");
          setAddress(res?.data?.masterWalletAddress || "");
        } else {
          setMode("auto");
          setAddress(perUserAddress);
        }
      } catch (e) {
        // graceful fallback
        setMode("auto");
        setAddress(perUserAddress);
        setErr(e?.response?.data?.message || "Failed to fetch deposit info");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAddress();
    return () => {
      mounted = false;
    };
  }, [axios, token, perUserAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="animate-pulse opacity-80">Loading deposit details…</span>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 mb-3">
          {err || "Deposit address not available."}
        </p>
        <NavLink
          to={"/login"}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Log in
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center flex-col p-6">
      <div className="mb-3 text-xs uppercase tracking-wider opacity-70">
        {mode === "manual" ? "Manual mode (Master Wallet)" : "Auto mode (Your Wallet)"}
      </div>

      <DepositQRCode walletAddress={address} />

      <div className="mt-4 text-center text-sm opacity-80 max-w-md">
        {mode === "manual" ? (
          <>
            <p>Send only <b>USDT-TRC20</b> to this address. Other assets may be lost.</p>
            <p className="mt-1">Your balance will be updated by admin after confirmation.</p>
          </>
        ) : (
          <p>Send only <b>USDT-TRC20</b> to your personal address shown above.</p>
        )}
      </div>

      <NavLink
        to={"/user-transactions"}
        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 cursor-pointer text-sm mt-6"
      >
        View Transaction History
      </NavLink>
    </div>
  );
};

export default Deposit;