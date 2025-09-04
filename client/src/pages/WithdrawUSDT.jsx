// src/pages/WithdrawUSDT.jsx
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const NETWORK = "USDT -TRC20";
const FIXED_FEE_USD = 7; // 🔒 keep in sync with backend

export default function WithdrawUSDT() {
  const navigate = useNavigate();
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  // ui state
  const [loading, setLoading] = useState(true);

  // form state
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(""); // user-entered USDT

  // load balance
  useEffect(() => {
    (async () => {
      try {
        await fetchUserBalance();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchUserBalance]);

  const available = Number(userBalance || 0);
  const parsedAmt = Number(amount || 0);
  const maxWithdrawable = Math.max(0, available - FIXED_FEE_USD);

  const errors = useMemo(() => {
    const e = [];
    if (!address) e.push("Wallet address is required.");
    if (!amount) e.push("Withdraw amount is required.");
    if (parsedAmt <= 0) e.push("Enter a valid amount.");
    if (parsedAmt > maxWithdrawable)
      e.push(`Amount exceeds maximum withdrawable (${maxWithdrawable.toFixed(2)} after $${FIXED_FEE_USD} fee).`);
    return e;
  }, [address, amount, parsedAmt, maxWithdrawable]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/profile");
  };

  const fillMax = () => {
    if (available <= FIXED_FEE_USD) {
      toast.error(`Not enough balance after $${FIXED_FEE_USD} fee.`);
      return;
    }
    setAmount(maxWithdrawable.toFixed(2));
  };

  const submit = async () => {
    // client-side guard (mirrors server)
    if (parsedAmt + FIXED_FEE_USD > available) {
      toast.error(
        `Insufficient: need ${(parsedAmt + FIXED_FEE_USD).toFixed(2)}, have ${available.toFixed(
          2
        )} (incl. $${FIXED_FEE_USD} fee).`
      );
      return;
    }
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/v1/users/withdrawals", {
        network: "TRC20",
        address,
        amount: parsedAmt, // net USDT the user will receive (fee is separate)
      });

      if (res.data?.success) {
        toast.success("Withdrawal request submitted.");
        await fetchUserBalance();
        navigate("/user-transactions"); // or "/profile"
      } else {
        toast.error(res.data?.message || "Failed to submit withdrawal.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit withdrawal.";
      // if backend returns details, surface them
      const details = err?.response?.data?.details;
      if (details) {
        toast.error(
          `${msg}: need ${Number(details.required).toFixed(2)}, have ${Number(
            details.availableBalance
          ).toFixed(2)}`
        );
      } else {
        toast.error(msg);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0F172A] min-h-screen text-white">
      <div className="p-4 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold">Withdraw USDT</h1>
          <span className="w-10" />
        </div>

        {/* Card */}
