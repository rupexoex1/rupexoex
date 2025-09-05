import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const NETWORK = "USDT -TRC20";
const FIXED_FEE_USD = 7; // must match backend

export default function WithdrawUSDT() {
  const navigate = useNavigate();
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await fetchUserBalance();
      } catch {}
      setLoading(false);
    })();
  }, [fetchUserBalance]);

  const available = Number(userBalance || 0);
  const parsedAmt = Number(amount || 0);
  const maxWithdrawable = Math.max(0, available - FIXED_FEE_USD);

  const errors = [];
  if (!address) errors.push("Wallet address is required.");
  if (!amount) errors.push("Withdraw amount is required.");
  if (parsedAmt <= 0) errors.push("Enter a valid amount.");
  if (parsedAmt > maxWithdrawable)
    errors.push(`Amount exceeds maximum withdrawable (${maxWithdrawable.toFixed(2)} after $${FIXED_FEE_USD} fee).`);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/profile");
  };

  const fillMax = () => {
    if (maxWithdrawable <= 0) {
      toast.error(`Not enough balance after $${FIXED_FEE_USD} fee.`);
      return;
    }
    setAmount(maxWithdrawable.toFixed(2));
  };

  const submit = async () => {
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
        amount: parsedAmt,
      });

      if (res.data?.success) {
        toast.success("Withdrawal request submitted.");
        await fetchUserBalance();
        navigate("/user-transactions");
      } else {
        toast.error(res.data?.message || "Failed to submit withdrawal.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit withdrawal.";
      const details = err?.response?.data?.details;
      if (details) {
        toast.error(
          `${msg}: need ${Number(details.required).toFixed(2)}, have ${Number(
            details.availableBalance ?? details.allowedAfterHolds
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
        <div className="bg-[#1E293B] rounded p-4">
          {/* Network */}
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

          {/* Amount + Withdraw All */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-300">Withdraw Amount</label>
              <button
                type="button"
                onClick={fillMax}
                className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700"
              >
                Withdraw All
              </button>
            </div>

            <div className="flex">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="— — —"
                className="flex-1 bg-[#0F172A] border border-r-0 border-[#334155] rounded-l px-3 py-2 text-sm outline-none focus:border-blue-500"
                inputMode="decimal"
              />
              <div className="bg-[#0F172A] border border-l-0 border-[#334155] rounded-r px-3 py-2 text-xs grid place-items-center">
                USDT
              </div>
            </div>

            {/* Inline helper */}
            <div className="mt-2 text-[11px] text-gray-300">
              Available: {available.toFixed(2)} — Fee: ${FIXED_FEE_USD.toFixed(2)} —{" "}
              Max withdrawable: {maxWithdrawable.toFixed(2)} USDT
            </div>
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
          disabled={loading}
          className="mt-5 w-full bg-[#2563eb] hover:bg-[#1e4fd3] disabled:opacity-50 rounded py-3 text-sm font-semibold"
        >
          {loading ? "Processing…" : "Confirm"}
        </button>

        {/* Client-side errors list */}
        {errors.length > 0 && (
          <ul className="mt-3 text-xs text-red-300 list-disc list-inside space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
