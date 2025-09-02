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
    userBalance,
    selectedPlan,
    selectedBank,
    // dynamic rates
    basicPrice,
    vipPrice,
    // dynamic limits
    basicMin,
    basicMax,
    vipMin,
  } = useAppContext();

  // final plan to use
  const plan = planFromState || selectedPlan;

  // derive price from context (kept in state for display/use)
  const [price, setPrice] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // memoized INR amount
  const inrAmount = useMemo(() => {
    const num = parseFloat(amount);
    if (!price || !Number.isFinite(num)) return 0;
    return num * price;
  }, [amount, price]);

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

    if (num > Number(userBalance)) {
      setError("You cannot sell more than your available balance");
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
        toast.success("Order placed successfully");
        navigate(`/order-tracking/${res.data.order._id}`);
      } else {
        toast.error(res.data?.message || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Server error");
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
            d="M5.121 17.804A9.953 9.953 0 0112 15c2.21 0 4.253.713 5.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
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
            Available:{" "}
            <span
              className={`${
                Number(userBalance) < Number(basicMin) ? "text-red-400" : "text-green-400"
              }`}
            >
              {Number(userBalance).toFixed(2)} USDT
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
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!!error || !amount || !price || !selectedBank}
        className={`w-full max-w-md py-3 rounded font-semibold text-white ${
          !!error || !amount || !price || !selectedBank
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
