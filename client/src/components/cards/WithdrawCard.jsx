import React from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CalendarClock, Hash, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";

const shortId = (id = "") => (id ? `#${id.slice(-6)}` : "--");

const StatusPill = ({ status = "pending" }) => {
  const map = {
    pending:  "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    approved: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
    rejected: "bg-red-500/15 text-red-300 border border-red-400/30",
  };
  const cls = map[status] || map.pending;
  const text = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {text}
    </span>
  );
};

const CopyBtn = ({ value, label = "Copy", toastLabel }) => {
  if (!value) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast.success(toastLabel || "Copied!");
      }}
      className="text-[11px] px-2 py-1 rounded-md border border-slate-600 hover:border-slate-400 text-slate-300"
      title={label}
      type="button"
    >
      <div className="flex items-center gap-1">
        <Copy size={12} />
        {label}
      </div>
    </button>
  );
};

const WithdrawCard = ({ wd = {} }) => {
  const navigate = useNavigate();
  const created = wd.createdAt ? new Date(wd.createdAt).toLocaleString() : "--";
  const amountUSDT = Number(wd.amount || 0);
  const feeUSD = Number(wd.feeUSD || 0);
  const totalHeld = amountUSDT + feeUSD;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/withdraw-tracking/${wd._id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/withdraw-tracking/${wd._id}`)}
      className="bg-[#10192d] border border-slate-700 hover:border-slate-500 rounded-2xl p-4 md:p-5 text-white shadow-lg mb-4 transition relative group focus:outline-none focus:ring-2 focus:ring-slate-400/40"
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Hash size={14} className="opacity-80" />
          <span className="text-sm font-semibold tracking-wide">
            {wd.withdrawalId || shortId(wd._id)}
          </span>
        </div>
        <StatusPill status={wd.status} />
      </div>

      {/* Amounts */}
      <div className="bg-slate-800/50 rounded-xl px-3 py-2.5 mb-3">
        <div className="flex items-center justify-between text-[13px] text-slate-300">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="opacity-70" />
            <span>Withdraw</span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <span>USDT {amountUSDT.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">• Fee ${feeUSD.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">• Held {totalHeld.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Destination + meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Network</span>
          </div>
          <span className="font-medium">{wd.network || "TRC20"}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Address</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium break-all max-w-[180px] md:max-w-[260px] truncate">{wd.address || "—"}</span>
            <CopyBtn value={wd.address} toastLabel="Address copied" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarClock size={14} />
            <span>Create time</span>
          </div>
          <span className="font-medium">{created}</span>
        </div>
      </div>

      {/* Hover hint */}
      <div className="absolute right-3 top-3 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
        View details →
      </div>
    </div>
  );
};

export default WithdrawCard;
