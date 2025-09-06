import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DepositQRCode from "./DepositQRCode";
import { useAppContext } from "../../context/AppContext";

const Deposit = () => {
  const navigate = useNavigate();
  const { axios, token } = useAppContext();
  const [address, setAddress] = useState("");
  const [mode, setMode] = useState("manual"); // default manual
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

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

    // /check-deposit:
    // manual mode => master wallet
    // auto mode   => per-user wallet forward logic
    const fetchAddress = async () => {
      try {
        if (!token) {
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
        // graceful fallback to per-user address (if any)
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

  // --- Shared header (with Back) ---
  const Header = (
    <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
      <button
        onClick={handleBack}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
        title="Go Back"
      >
        <ArrowLeft size={18} />
      </button>
      <h1 className="text-base font-semibold">Deposit USDT</h1>
      <span className="w-10 h-10" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        {Header}
        <div className="p-6 flex items-center justify-center">
          <span className="animate-pulse opacity-80">Loading deposit details…</span>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-black text-white">
        {Header}
        <div className="p-6 flex flex-col items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {Header}

      <div className="p-6 flex justify-center items-center flex-col">
        <div className="mb-3 text-xs uppercase tracking-wider opacity-70">
          {mode === "manual" ? "Manual mode (Master Wallet)" : "Auto mode (Your Wallet)"}
        </div>

        <DepositQRCode walletAddress={address} />

        <div className="mt-4 text-center text-sm opacity-80 max-w-md">
          {mode === "manual" ? (
            <>
              <p>
                Send only <b>USDT-TRC20</b> to this address. Other assets may be lost.
              </p>
              <p className="mt-1">
                Your balance will be updated by admin after confirmation.
              </p>
            </>
          ) : (
            <p>
              Send only <b>USDT-TRC20</b> to your personal address shown above.
            </p>
          )}
        </div>

        <NavLink
          to={"/user-transactions"}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 cursor-pointer text-sm mt-6"
        >
          View Transaction History
        </NavLink>
      </div>
    </div>
  );
};

export default Deposit;
