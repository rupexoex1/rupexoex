import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const NETWORK_LABEL = "USDT - TRC20";
const FIXED_FEE_USD = 7; // must match backend

export default function WithdrawUSDT() {
  const navigate = useNavigate();
  const { axios, userBalance, fetchUserBalance } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(""); // USDT (fee separate)

  useEffect(() => {
    (async () => {
      try { await fetchUserBalance(); } catch {}
      setLoading(false);
    })();
  }, [fetchUserBalance]);

  const available = Number(userBalance || 0);        // NET (holds already deducted)
  const parsedAmt = Number(amount || 0);
  const maxWithdrawable = Math.max(0, available - FIXED_FEE_USD);
  const totalDebit = parsedAmt > 0 ? parsedAmt + FIXED_FEE_USD : 0;

  const hasAddress = address.trim().length > 0;
  const validAmt   = Number.isFinite(parsedAmt) && parsedAmt > 0;
  const withinBal  = totalDebit <= available + 1e-6; // float guard
  const canSubmit  = !loading && hasAddress && validAmt && withinBal;

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
    if (!canSubmit) {
      if (!hasAddress) return toast.error("Wallet address is required.");
      if (!validAmt)   return toast.error("Enter a valid amount.");
      if (!withinBal)  return toast.error(`Insufficient: need ${totalDebit.toFixed(2)}, have ${available.toFixed(2)}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/v1/users/withdrawals", {
        network: "TRC20",
        address: address.trim(),   // ✅ trim before sending
        amount: parsedAmt,
      });

      if (res.data?.success) {
        toast.success("Withdrawal request submitted.");
        await fetchUserBalance();
        navigate(`/withdraw-tracking/${res.data.withdrawal._id}`);
      } else {
        toast.error(res.data?.message || "Failed to submit withdrawal.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit withdrawal.";
      const details = err?.response?.data?.details;
      if (details) {
        const need = Number(details.required);
        const have = Number(details.availableBalance ?? details.allowedAfterHolds);
        toast.error(`${msg}: need ${need.toFixed(2)}, have ${have.toFixed(2)}`);
      } else {
        toast.error(msg);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmtUSD = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
      .format(Number(n || 0));

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
            <span>{NETWORK_LABEL}</span>
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
                placeholder="0.00"
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

        {/* Total debit summary */}
        <div className="mt-4 bg-[#0F172A] rounded p-3 border border-[#25324a]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Total debit (amount + ${FIXED_FEE_USD})</span>
            <span className="font-semibold">{fmtUSD(totalDebit)}</span>
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={`mt-5 w-full rounded py-3 text-sm font-semibold ${
            canSubmit ? "bg-[#2563eb] hover:bg-[#1e4fd3]" : "bg-slate-700 cursor-not-allowed"
          }`}
        >
          {loading ? "Processing…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
