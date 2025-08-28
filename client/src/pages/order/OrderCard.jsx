import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Repeat,
  Copy,
  CalendarClock,
  ArrowRightLeft,
  CreditCard,
  User,
  Hash,
} from "lucide-react";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n || 0)
  );

const shortId = (id = "") => (id ? `#${id.slice(-6)}` : "--");

const StatusPill = ({ status = "pending" }) => {
  const map = {
    pending: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    confirmed: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
    failed: "bg-red-500/15 text-red-300 border border-red-400/30",
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

const CopyBtn = ({ value, label = "Copy" }) => {
  if (!value) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
      }}
      className="text-[11px] px-2 py-1 rounded-md border border-slate-600 hover:border-slate-400 text-slate-300"
      title={label}
    >
      <div className="flex items-center gap-1">
        <Copy size={12} />
        {label}
      </div>
    </button>
  );
};

const OrderCard = ({ order = {} }) => {
  const navigate = useNavigate();
  const acc = order.bankAccount || {};
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "--";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/order-tracking/${order._id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/order-tracking/${order._id}`)}
      className="bg-[#10192d] border border-slate-700 hover:border-slate-500 rounded-2xl p-4 md:p-5 text-white shadow-lg mb-4 transition relative group focus:outline-none focus:ring-2 focus:ring-slate-400/40"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Hash size={14} className="opacity-80" />
          <span className="text-sm font-semibold tracking-wide">
            {order.orderId || shortId(order._id)}
          </span>
        </div>
        <StatusPill status={order.status} />
      </div>

      {/* Amounts */}
      <div className="bg-slate-800/50 rounded-xl px-3 py-2.5 mb-3">
        <div className="flex items-center justify-between text-[13px] text-slate-300">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={14} className="opacity-70" />
            <span>Trade</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>USDT {order.amount ?? "--"}</span>
            <Repeat size={14} className="text-blue-300" />
            <span>{formatINR(order.inrAmount)}</span>
          </div>
        </div>
      </div>

      {/* Bank info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <User size={14} />
            <span>Account Holder</span>
          </div>
          <span className="font-medium text-right">
            {acc.accountHolder || acc.holderName || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <CreditCard size={14} />
            <span>Account No</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium break-all">{acc.accountNumber || "N/A"}</span>
            <CopyBtn value={acc.accountNumber} label="Copy" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-xs font-mono">IFSC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{acc.ifsc || "N/A"}</span>
            <CopyBtn value={acc.ifsc} label="Copy" />
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

export default OrderCard;
