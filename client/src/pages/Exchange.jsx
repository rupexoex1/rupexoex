// src/pages/Exchange.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Headset, Wallet2, Info, ShieldCheck, HelpCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import USDTPriceCards from "../components/containers/USDTPriceCards";

// helper: USD format with compact fallback for long strings
const formatUSD = (n, { compact = false } = {}) => {
  const opts = { style: "currency", currency: "USD", maximumFractionDigits: 2 };
  if (compact) opts.notation = "compact";
  return new Intl.NumberFormat("en-US", opts).format(Number(n || 0));
};

const Exchange = () => {
  const navigate = useNavigate();

  const {
    axios,
    token,
    userBalance,           // NET balance (credits/forwarded - deducts)
    fetchUserBalance,
    selectedPlan,
    basicPrice,
    vipPrice,
    basicMin,
    basicMax,
    vipMin,
  } = useAppContext();

  // local: processing hold (sum of all pending orders)
  const [processingHold, setProcessingHold] = useState(0);
  const [loading, setLoading] = useState(true);

  // fetch balance + pending orders
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await fetchUserBalance();
        const res = await axios.get("/api/v1/users/orders");
        const pending = Array.isArray(res.data?.orders)
          ? res.data.orders
              .filter((o) => o.status === "pending")
              .reduce((sum, o) => sum + Number(o.amount || 0), 0)
          : 0;
        setProcessingHold(pending);
      } catch (e) {
        console.error("Exchange: fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, axios, fetchUserBalance]);

  // ✅ Correct math (same as Profile)
  const available = useMemo(() => Number(userBalance || 0), [userBalance]); // net after holds
  const processing = useMemo(() => Number(processingHold || 0), [processingHold]);
  const total = useMemo(() => available + processing, [available, processing]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

  const goSupport = () => {
    window.open("https://wa.me/923236619004?text=Hello%20Rupexo%20Support", "_blank", "noopener,noreferrer");
  };

  const goSell = () => {
    if (!token) return navigate("/login", { state: { redirectTo: "/sell" } });
    if (!selectedPlan) return;
    navigate("/sell", { state: { plan: selectedPlan } });
  };

  const StatTile = ({ label, value, icon }) => {
    const full = loading ? "…" : formatUSD(value);
    const show =
      loading ? "…" : (full.length > 14 ? formatUSD(value, { compact: true }) : full);

    return (
      <div className="bg-[#111a2d] border border-slate-700 rounded-xl p-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700">{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-xs font-semibold truncate" title={loading ? "" : full}>
            {show}
          </div>
        </div>
      </div>
    );
  };

  const LimitRow = ({ k, v }) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-400">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800/60 bg-[#0e1730] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold">Exchange</h1>
          <button
            onClick={goSupport}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            title="Support"
          >
            <Headset size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-6 max-w-3xl mx-auto">

        {/* Balance Tiles */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            label="Total"
            value={total}
            icon={<Wallet2 size={16} className="text-slate-300" />}
          />
          <StatTile
            label="Available"
            value={available}
            icon={<ShieldCheck size={16} className="text-emerald-300" />}
          />
          <StatTile
            label="Processing"
            value={processing}
            icon={<Info size={16} className="text-amber-300" />}
          />
        </div>

        {/* Plans / Rates */}
        <section className="rounded-2xl border border-slate-800 bg-[#0f192f] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Select a Plan</h2>
            <div className="text-xs text-slate-400">Live rates of today</div>
          </div>

          <USDTPriceCards />

          <div className="mt-2 text-[11px] text-slate-400">
            Choose a plan to continue. You’ll specify USDT on the next step.
          </div>

          <div className="mt-4">
            <button
              onClick={goSell}
              disabled={!selectedPlan}
              className={`w-full py-2.5 rounded-lg font-semibold ${
                selectedPlan
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-700 cursor-not-allowed"
              }`}
            >
              {selectedPlan ? `Continue with ${selectedPlan}` : "Select a plan to continue"}
            </button>
          </div>
        </section>

        {/* Limits & Fees */}
        <section className="rounded-2xl border border-slate-800 bg-[#0f192f] p-4">
          <h3 className="text-base font-semibold mb-3">Limits & Fees</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-[#101b34] p-3">
              <div className="text-sm font-semibold mb-2">Basic</div>
              <LimitRow k="Rate" v={`${basicPrice} ₹`} />
              <LimitRow k="Min" v={`${basicMin} USDT`} />
              <LimitRow k="Max" v={`${basicMax} USDT`} />
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#101b34] p-3">
              <div className="text-sm font-semibold mb-2">VIP</div>
              <LimitRow k="Rate" v={`${vipPrice} ₹`} />
              <LimitRow k="Min" v={`>${Number(vipMin) - 1} USDT`} />
              <LimitRow k="Max" v={`—`} />
            </div>
          </div>

          <div className="mt-3 text-[12px] text-slate-400">
            Note: Withdrawals include a fixed network fee of <span className="font-semibold text-slate-200">$7</span>.
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-slate-800 bg-[#0f192f] p-4">
          <h3 className="text-base font-semibold mb-3">How it works</h3>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-slate-300">
            <li>Select <span className="font-semibold">Basic</span> or <span className="font-semibold">VIP</span> plan.</li>
            <li>Enter USDT amount and confirm the order.</li>
            <li>Your order stays <span className="text-amber-300 font-medium">Pending</span> while it’s processed.</li>
            <li>On <span className="text-emerald-300 font-medium">Confirm</span>, funds are settled; on <span className="text-red-300 font-medium">Fail</span>, hold is refunded.</li>
          </ol>
        </section>

        {/* Help / FAQ */}
        <section className="rounded-2xl border border-slate-800 bg-[#0f192f] p-4">
          <h3 className="text-base font-semibold mb-3">Need help?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <HelpCircle size={16} className="text-slate-300 mt-0.5" />
              <p className="text-slate-300">
                Track your orders in <span className="font-semibold">Exchange History</span> from the Profile screen.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <HelpCircle size={16} className="text-slate-300 mt-0.5" />
              <p className="text-slate-300">
                Need to add a bank payee? Go to <span className="font-semibold">Bank Accounts</span> from Profile.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <HelpCircle size={16} className="text-slate-300 mt-0.5" />
              <p className="text-slate-300">
                For support, tap the headset icon on top-right.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Exchange;
