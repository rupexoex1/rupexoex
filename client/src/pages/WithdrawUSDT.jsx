// src/pages/WithdrawUSDT.jsx
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const NETWORK = "USDT -TRC20";

export default function WithdrawUSDT() {
  const navigate = useNavigate();
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  // config (fallback fee = $6 like screenshot)
  const [feeUSD, setFeeUSD] = useState(6);
  const [loading, setLoading] = useState(true);

  // form
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  // load balance + optional fee config
  useEffect(() => {
    (async () => {
      try {
        await fetchUserBalance();
        // OPTIONAL: if you have an endpoint for withdraw config, uncomment:
        // const cfg = await axios.get("/api/v1/users/withdraw-config");
        // if (cfg.data?.success) setFeeUSD(Number(cfg.data.feeUSD ?? 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [axios, fetchUserBalance]);

  const available = Number(userBalance || 0);
  const parsedAmt = Number(amount || 0);
  const disabled = loading;

  const errors = useMemo(() => {
    const e = [];
    if (!address) e.push("Wallet address is required.");
    if (!amount) e.push("Withdraw amount is required.");
    if (parsedAmt <= 0) e.push("Enter a valid amount.");
    if (parsedAmt > available) e.push("Amount exceeds available balance.");
    return e;
  }, [address, amount, parsedAmt, available]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/profile");
  };

  const submit = async () => {
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    try {
      setLoading(true);
      // POST your withdrawal request
      // If your route is different, tell me and I’ll adjust.
      const res = await axios.post("/api/v1/users/withdrawals", {
        network: "TRC20",
        address,
        amount: parsedAmt, // USDT amount
      });

      if (res.data?.success) {
        toast.success("Withdrawal request submitted.");
        // refresh balance
        await fetchUserBalance();
        navigate("/user-transactions"); // or back to /profile — your call
      } else {
        toast.error(res.data?.message || "Failed to submit withdrawal.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit withdrawal.";
      toast.error(msg);
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

        {/* Network */}
        <div className="bg-[#1E293B] rounded p-4">
          <label className="block text-sm text-gray-300 mb-2">Network</label>
          <div className="bg-[#0F172A] rounded px-3 py-3 text-sm flex items-center gap-2">
            <div className="w-5 h-5 bg-green-600 rounded-full grid place-items-center text-[10px]">T</div>
            <span>{NETWORK}</span>
          </div>

          {/* Address */}
          <div className="mt-4">
            <label className="block text-sm text-gray-300 mb-2">Wallet address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Please enter Wallet Address"
              className="w-full bg-[#0F172A] border border-[#334155] rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Amount */}
          <div className="mt-4">
            <label className="block text-sm text-gray-300 mb-2">Withdraw Amount</label>
            <div className="flex">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="— — —"
                className="flex-1 bg-[#0F172A] border border-r-0 border-[#334155] rounded-l px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="bg-[#0F172A] border border-l-0 border-[#334155] rounded-r px-3 py-2 text-xs grid place-items-center">
                USDT
              </div>
            </div>
          </div>

          {/* Available + Fee */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-300">
            <div>Available: ${available.toFixed(2)}</div>
            <div>Fee: ${feeUSD.toFixed(2)}</div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-gradient-to-br from-[#0b1220] to-[#0f1b33] rounded p-4 border border-[#1b2740]">
          <div className="w-6 h-6 bg-blue-600 rounded grid place-items-center text-white text-xs mb-2">i</div>
          <p className="text-[11px] leading-5 text-gray-300">
            For the safety of your funds, please note that the recharge address for each order may be
            different. Please double-check carefully to avoid the risk of irretrievable funds.
          </p>
        </div>

        {/* Confirm */}
        <button
          onClick={submit}
          disabled={disabled}
          className="mt-5 w-full bg-[#2563eb] hover:bg-[#1e4fd3] disabled:opacity-50 rounded py-3 text-sm font-semibold"
        >
          {loading ? "Processing…" : "Confirm"}
        </button>

        {/* Client-side inline errors (first one is also toasted) */}
        {!!errors.length && (
          <ul className="mt-3 text-xs text-red-300 list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
