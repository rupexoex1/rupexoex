// src/pages/Exchange/SellUSDT.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const SellUSDT = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // plan can come from router state or context fallback
  const planFromState = location.state?.plan;
  const {
    axios,
    userBalance,              // virtual balance from backend
    selectedPlan,
    selectedBank,
    // dynamic rates
    basicPrice,
    vipPrice,
    // dynamic limits
    basicMin,
    basicMax,
    vipMin,
    // to refresh balance after placing order (hold deducted immediately on backend)
    fetchUserBalance,
  } = useAppContext();

  // final plan to use
  const plan = planFromState || selectedPlan;

  // derive price from context (kept in state for display/use)
  const [price, setPrice] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: processing hold (sum of user's pending orders)
  const [processingHold, setProcessingHold] = useState(0);
  const [holdLoading, setHoldLoading] = useState(true);

  // when plan or context prices change, recompute local price
  useEffect(() => {
    if (!plan) return;
    const p = plan === "Basic" ? Number(basicPrice) : Number(vipPrice);
    setPrice(Number.isFinite(p) ? p : null);
  }, [plan, basicPrice, vipPrice]);

  // guard: if plan missing, go back home
  useEffect(() => {
    if (!plan) navigate("/");
  }, [plan, navigate]);

  // fetch user's pending orders → processing hold
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/v1/users/orders");
        const pendingSum = Array.isArray(res.data?.orders)
          ? res.data.orders
            .filter((o) => o.status === "pending")
            .reduce((s, o) => s + Number(o.amount || 0), 0)
          : 0;
        setProcessingHold(pendingSum);
      } catch (e) {
        console.error("SellUSDT: fetch processing hold error:", e);
        setProcessingHold(0);
      } finally {
        setHoldLoading(false);
      }
    })();
  }, [axios]);

  // memoized INR amount
  const inrAmount = useMemo(() => {
    const num = parseFloat(amount);
    if (!price || !Number.isFinite(num)) return 0;
    return num * price;
  }, [amount, price]);

  // 🔐 Available after holds (this is what user can actually sell)
  const available = Number(userBalance || 0);
  const availableAfterHold = Math.max(0, available - Number(processingHold || 0));

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    const num = parseFloat(value);

    // reset error early
    setError("");

    if (!value || !Number.isFinite(num)) {
      setError("Enter a valid number");
      return;
    }

    // dynamic validation via limits from context
    if (plan === "Basic") {
      if (num < Number(basicMin) || num > Number(basicMax)) {
        setError(`Basic plan allows ${basicMin} to ${basicMax} USDT only`);
        return;
      }
    } else if (plan === "VIP") {
      if (num <= Number(vipMin) - 1) {
        setError(`VIP plan allows more than ${Number(vipMin) - 1} USDT`);
        return;
      }
    }

    // ✅ Validate against availableAfterHold, NOT total balance
    if (num > availableAfterHold) {
      setError("You cannot sell more than your available balance (after holds)");
      return;
    }
  };

  const handleConfirm = async () => {
    if (!plan) return toast.error("Plan not selected");
    if (!selectedBank) return toast.error("Please select a payee");
    if (!amount || !price || error) return toast.error("Fix the form errors first");

    setLoading(true);
    try {
      const res = await axios.post("/api/v1/users/orders", {
        amount: parseFloat(amount),
        inrAmount,
        plan,
        price,
        bankAccount: {
          accountNumber: selectedBank.accountNumber,
          ifsc: selectedBank.ifsc,
          accountHolder: selectedBank.holderName,
        },
      });

      if (res.data?.success) {
        toast.success("Order placed. Balance held.");
        // refresh balance to reflect immediate hold/deduct
        await fetchUserBalance?.();
        navigate(`/order-tracking/${res.data.order._id}`);
      } else {
        toast.error(res.data?.message || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Server error";
      const details = err?.response?.data?.details;
      if (details?.allowed !== undefined && details?.requested !== undefined) {
        toast.error(`${msg}: allowed ${Number(details.allowed).toFixed(2)}, requested ${Number(details.requested).toFixed(2)}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Exchange</h1>

      {/* Select Payee */}
      <button
        onClick={() => navigate("/select-payee")}
        className="w-full max-w-md mb-5 flex items-center justify-center gap-2 text-white border border-[#3b82f6] rounded-full py-2 px-4 hover:bg-[#1e293b] transition duration-200 cursor-pointer"
      >
        <span>Select Payee</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A9.953 9.953 0 01112 15c2.21 0 4.253.713 5.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Payee details */}
      {selectedBank ? (
        <div className="bg-[#1e293b] w-full max-w-md rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Account No</span>
            <span className="font-semibold">{selectedBank.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>IFSC</span>
            <span className="font-semibold">{selectedBank.ifsc}</span>
          </div>
          <div className="flex justify-between">
            <span>Account Name</span>
            <span className="font-semibold">{selectedBank.holderName}</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-red-400 mb-3">No payee selected</div>
      )}

      {/* Amount + Rate */}
      <div className="bg-[#1e293b] w-full max-w-md rounded-lg p-4 space-y-3 text-sm mb-4">
        <div className="flex items-center border border-gray-600 rounded px-2 py-2">
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="bg-transparent outline-none w-full text-white"
            placeholder="Enter USDT Amount"
            min="0"
          />
          <span className="text-blue-400 text-xs ml-2">USDT</span>
        </div>

        {error && <div className="text-red-400 text-xs">{error}</div>}

        <div className="flex justify-between items-center text-sm mt-1">
          <span>
            Available (after holds):{" "}
            <span
              className={`${availableAfterHold < Number(basicMin) ? "text-red-400" : "text-green-400"
                }`}
            >
              {holdLoading ? "…" : `${availableAfterHold.toFixed(2)} USDT`}
            </span>
          </span>
          {price && (
            <span>
              1 USDT = <span className="text-green-400">{price} ₹</span>
            </span>
          )}
        </div>

        {/* Dynamic limits hint */}
        <div className="text-xs text-slate-400">
          {plan === "Basic"
            ? `Allowed: ${basicMin}–${basicMax} USDT`
            : `Allowed: > ${Number(vipMin) - 1} USDT`}
        </div>

        <div className="text-md font-semibold mt-1">
          You will receive:{" "}
          <span className="text-green-400">
            {inrAmount ? `${inrAmount.toFixed(2)} ₹` : "0 ₹"}
          </span>
        </div>

        {/* Optional helper to show current holds */}
        <div className="text-[11px] text-slate-400">
          Current holds (pending orders): {holdLoading ? "…" : Number(processingHold || 0).toFixed(2)} USDT
        </div>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!!error || !amount || !price || !selectedBank}
        className={`w-full max-w-md py-3 rounded font-semibold text-white ${!!error || !amount || !price || !selectedBank
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {loading ? "Placing Order..." : "Confirm"}
      </button>
    </div>
  );
};

export default SellUSDT;