import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const formatDateTime = (dt) => {
  if (!dt) return "--";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
};

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n || 0)
  );

const Step = ({ title, subtitle, active, done, danger = false, last = false }) => (
  <div className="relative pl-8">
    {/* line */}
    {!last && (
      <div
        className={`absolute left-[11px] top-5 h-full w-[2px] ${done ? (danger ? "bg-red-500" : "bg-emerald-500") : "bg-slate-700"
          }`}
      />
    )}

    {/* dot */}
    <div
      className={`absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 ${done ? (danger ? "border-red-500 bg-red-500" : "border-emerald-500 bg-emerald-500") : "border-slate-500 bg-slate-900"
        }`}
    />

    <div className="mb-6">
      <div
        className={`font-semibold ${danger ? "text-red-400" : done ? "text-emerald-400" : active ? "text-white" : "text-slate-300"
          }`}
      >
        {title}
      </div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    pending: { text: "Pending", className: "bg-amber-500/15 text-amber-300 border border-amber-400/30" },
    confirmed: { text: "Confirmed", className: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30" },
    failed: { text: "Failed", className: "bg-red-500/15 text-red-300 border border-red-400/30" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {s.text}
    </span>
  );
};

const CopyButton = ({ text, label = "Copy" }) => {
  return (
    <button
      onClick={() => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
      className="text-xs px-2 py-1 rounded-md border border-slate-600 hover:border-slate-400 text-slate-200"
    >
      {label}
    </button>
  );
};

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-28 rounded-2xl bg-slate-800/60" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64 rounded-2xl bg-slate-800/60 md:col-span-2" />
      <div className="h-64 rounded-2xl bg-slate-800/60" />
    </div>
  </div>
);

const OrderTracking = () => {
  const { id } = useParams();
  const { axios } = useAppContext();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const pollRef = useRef(null);

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      } else {
        setRefreshing(true);
      }
      const res = await axios.get(`/api/v1/users/orders/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
      } else {
        setError(res.data?.message || "Failed to fetch order");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll while pending
  useEffect(() => {
    if (!order) return;
    if (order.status === "pending") {
      pollRef.current = setInterval(() => fetchOrder(true), 7000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  const stepState = useMemo(() => {
    // Steps:
    // 1. Order Placed
    // 2. Processing (Pending)
    // 3. Completed (Confirmed) OR Failed
    const status = order?.status || "pending";
    const isFailed = status === "failed";
    return {
      step1: { done: true },
      step2: { done: status !== "pending", active: status === "pending" },
      step3: { done: status !== "pending", danger: isFailed },
    };
  }, [order?.status]);

  const headerAccent =
    order?.status === "confirmed"
      ? "from-emerald-600/25 to-emerald-400/10 border-emerald-500/30"
      : order?.status === "failed"
        ? "from-red-600/25 to-red-400/10 border-red-500/30"
        : "from-amber-600/25 to-amber-400/10 border-amber-500/30";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b1220] text-slate-100 px-4 md:px-8 py-6">
      {/* Header card */}
      <div
        className={`rounded-2xl border ${headerAccent} bg-gradient-to-br p-5 md:p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
      >
        <div>
          <div className="text-sm text-slate-300/80">Order#</div>
          <div className="flex items-center gap-2 mt-1">
            {/* 👇 yahan short id (last 6) show karo */}
            <code className="text-base md:text-lg tracking-wide bg-black/30 px-2.5 py-1.5 rounded-md">
              {(order?._id || id || "").slice(-6) || "--"}
            </code>

            {/* 👇 is button se abhi bhi FULL ID copy hogi (good UX) */}
            <CopyButton text={order?._id || id} label="Copy Full ID" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill status={order?.status || "pending"} />
            {refreshing && <span className="text-xs text-slate-400 animate-pulse">Refreshing…</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => fetchOrder(true)}
            className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-600 text-sm"
          >
            Refresh
          </button>
          <Link
            to="/orders"
            className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-white text-sm font-semibold"
          >
            Back to Orders
          </Link>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="text-red-300 font-semibold mb-1">Error</div>
          <div className="text-sm text-red-200/90">{error}</div>
          <button
            onClick={() => fetchOrder()}
            className="mt-4 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: Timeline */}
          <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-[#10192d] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Progress</h3>
              <div className="text-xs text-slate-400">
                Created: {formatDateTime(order?.createdAt)}{" "}
                {order?.completedAt && (
                  <>
                    • Completed: <span className="text-slate-300">{formatDateTime(order.completedAt)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-2">
              <Step
                title="Order Placed"
                subtitle="We received your order request"
                active={!stepState.step2.done}
                done={stepState.step1.done}
              />
              <Step
                title={order?.status === "pending" ? "Processing" : order?.status === "failed" ? "Processing halted" : "Processing complete"}
                subtitle={
                  order?.status === "pending"
                    ? "Awaiting admin action"
                    : order?.status === "failed"
                      ? "This order was marked as failed"
                      : "Admin has confirmed your order"
                }
                active={order?.status === "pending"}
                done={stepState.step2.done}
                danger={order?.status === "failed"}
              />
              <Step
                title={order?.status === "failed" ? "Failed" : "Completed"}
                subtitle={
                  order?.status === "failed"
                    ? "No balance was deducted for this order"
                    : "Balance deducted and order marked complete"
                }
                done={stepState.step3.done}
                danger={order?.status === "failed"}
                last
              />
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="rounded-2xl border border-slate-700 bg-[#10192d] p-5 space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-3">Amounts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">USDT</span>
                  <span className="font-semibold text-slate-100">USDT {order?.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">INR (calculated)</span>
                  <span className="font-semibold text-slate-100">{formatINR(order?.inrAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Plan</span>
                  <span className="font-medium">{order?.plan || "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rate</span>
                  <span className="font-medium">{order?.price ?? "--"}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-3">Payee (Bank) Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Account Holder</span>
                  <span className="font-medium text-right">
                    {order?.bankAccount?.accountHolder || order?.bankAccount?.holderName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Account Number</span>
                  <span className="font-medium text-right break-all">
                    {order?.bankAccount?.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">IFSC</span>
                  <span className="font-medium text-right">{order?.bankAccount?.ifsc || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Bank</span>
                  <span className="font-medium text-right">{order?.bankAccount?.bankName || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <CopyButton text={order?.bankAccount?.accountNumber} label="Copy A/C No" />
                  <CopyButton text={order?.bankAccount?.ifsc} label="Copy IFSC" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-3">Meta</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="font-medium">{formatDateTime(order?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="font-medium">{formatDateTime(order?.completedAt)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 rounded-lg border border-slate-600 hover:border-slate-400 text-sm"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => {
                  const text = `Order ${order?._id}\nStatus: ${order?.status}\nAmount: USDT ${order?.amount} (${formatINR(
                    order?.inrAmount
                  )})\nCreated: ${formatDateTime(order?.createdAt)}\n${order?.completedAt ? "Completed: " + formatDateTime(order.completedAt) : ""
                    }`;
                  navigator.clipboard.writeText(text);
                  toast.success("Order summary copied");
                }}
                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-white text-sm font-semibold"
              >
                Copy Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
