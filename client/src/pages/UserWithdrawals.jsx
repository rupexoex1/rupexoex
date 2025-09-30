import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

/* ---------- Small helpers ---------- */
const formatDateTime = (dt) => {
  if (!dt) return "--";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
};

const CopyButton = ({ text, label = "Copy" }) => (
  <button
    onClick={async () => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      } catch {
        toast.error("Copy failed");
      }
    }}
    className="text-xs px-2 py-1 rounded-md border border-slate-600 hover:border-slate-400 text-slate-200"
  >
    {label}
  </button>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-28 rounded-2xl bg-slate-800/60" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64 rounded-2xl bg-slate-800/60 md:col-span-2" />
      <div className="h-64 rounded-2xl bg-slate-800/60" />
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    pending:  { text: "Pending",  className: "bg-amber-500/15 text-amber-300 border border-amber-400/30" },
    approved: { text: "Approved", className: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30" },
    rejected: { text: "Rejected", className: "bg-red-500/15 text-red-300 border border-red-400/30" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {s.text}
    </span>
  );
};

const Step = ({ title, subtitle, active, done, danger = false, last = false }) => (
  <div className="relative pl-8">
    {!last && (
      <div
        className={`absolute left-[11px] top-5 h-full w-[2px] ${
          done ? (danger ? "bg-red-500" : "bg-emerald-500") : "bg-slate-700"
        }`}
      />
    )}
    <div
      className={`absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 ${
        done
          ? danger
            ? "border-red-500 bg-red-500"
            : "border-emerald-500 bg-emerald-500"
          : "border-slate-500 bg-slate-900"
      }`}
    />
    <div className="mb-6">
      <div
        className={`font-semibold ${
          danger ? "text-red-400" : done ? "text-emerald-400" : active ? "text-white" : "text-slate-300"
        }`}
      >
        {title}
      </div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
    </div>
  </div>
);

/* ---------- Page ---------- */
export default function WithdrawTracking() {
  const { id } = useParams();
  const { axios } = useAppContext();

  const [wd, setWd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const fetchWithdrawal = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      } else {
        setRefreshing(true);
      }
      const res = await axios.get(`/api/v1/users/withdrawals/${id}`);
      if (res.data?.success && res.data.withdrawal) {
        setWd(res.data.withdrawal);
      } else {
        setError(res.data?.message || "Not found");
      }
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Withdrawal not found"
          : err?.response?.data?.message || "Failed to fetch withdrawal"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // initial
  useEffect(() => {
    // clear any previous poll if navigating between ids
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    fetchWithdrawal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // poll while pending
  useEffect(() => {
    if (!wd) return;
    // clear previous interval defensively
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (wd.status === "pending") {
      pollRef.current = setInterval(() => fetchWithdrawal(true), 7000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wd?.status]);

  const headerAccent =
    wd?.status === "approved"
      ? "from-emerald-600/25 to-emerald-400/10 border-emerald-500/30"
      : wd?.status === "rejected"
      ? "from-red-600/25 to-red-400/10 border-red-500/30"
      : "from-amber-600/25 to-amber-400/10 border-amber-500/30";

  const steps = useMemo(() => {
    const status = wd?.status || "pending";
    const isRejected = status === "rejected";
    return {
      s1: { done: true },
      s2: { done: status !== "pending", active: status === "pending" },
      s3: { done: status !== "pending", danger: isRejected },
    };
  }, [wd?.status]);

  const amountUSDT = Number(wd?.amount ?? 0);
  const feeUSD = Number(wd?.feeUSD ?? 0);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0b1220] text-slate-100 px-4 md:px-8 py-6">
      {/* Header */}
      <div
        className={`rounded-2xl border ${headerAccent} bg-gradient-to-br p-5 md:p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
      >
        <div>
          <div className="text-sm text-slate-300/80">Withdrawal#</div>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-base md:text-lg tracking-wide bg-black/30 px-2.5 py-1.5 rounded-md">
              {(wd?._id || id || "").slice(-6) || "--"}
            </code>
            <CopyButton text={wd?._id || id} label="Copy Full ID" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill status={wd?.status || "pending"} />
            {refreshing && <span className="text-xs text-slate-400 animate-pulse">Refreshing…</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => fetchWithdrawal(true)}
            className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 border border-slate-600 text-sm"
          >
            Refresh
          </button>
          <Link
            to="/user-withdrawals"
            className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-white text-sm font-semibold"
          >
            Back to Withdrawals
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
            onClick={() => fetchWithdrawal()}
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
              <h3 className="text-lg font-semibold">Withdrawal Progress</h3>
              <div className="text-xs text-slate-400">
                Created: {formatDateTime(wd?.createdAt)}{" "}
                {wd?.completedAt && (
                  <>
                    • Completed:{" "}
                    <span className="text-slate-300">{formatDateTime(wd.completedAt)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-2">
              <Step
                title="Request Submitted"
                subtitle="We received your withdrawal request"
                active={!steps.s2.done}
                done={steps.s1.done}
              />
              <Step
                title={
                  wd?.status === "pending"
                    ? "Processing"
                    : wd?.status === "rejected"
                    ? "Processing halted"
                    : "Processing complete"
                }
                subtitle={
                  wd?.status === "pending"
                    ? "Awaiting admin review"
                    : wd?.status === "rejected"
                    ? "This withdrawal was rejected"
                    : "Withdrawal approved"
                }
                active={wd?.status === "pending"}
                done={steps.s2.done}
                danger={wd?.status === "rejected"}
              />
              <Step
                title={wd?.status === "rejected" ? "Rejected" : "Completed"}
                subtitle={
                  wd?.status === "rejected"
                    ? "Your hold was refunded to your balance"
                    : "Funds will arrive to your wallet shortly"
                }
                done={steps.s3.done}
                danger={wd?.status === "rejected"}
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
                  <span className="text-slate-400">Withdraw Amount</span>
                  <span className="font-semibold">USDT {amountUSDT.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Platform Fee</span>
                  <span className="font-semibold">${feeUSD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Net to Wallet</span>
                  <span className="font-semibold">USDT {amountUSDT.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-3">Destination</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Network</span>
                  <span className="font-medium">{wd?.network || "TRC20"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Address</span>
                  <span className="font-medium text-right break-all">{wd?.address || "—"}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <CopyButton text={wd?.address} label="Copy Address" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-3">Meta</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="font-medium">{formatDateTime(wd?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="font-medium">{formatDateTime(wd?.completedAt)}</span>
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
                onClick={async () => {
                  const text =
                    `Withdrawal ${wd?._id}\n` +
                    `Status: ${wd?.status}\n` +
                    `Amount: USDT ${amountUSDT.toFixed(2)}\n` +
                    `Fee: $${feeUSD.toFixed(2)}\n` +
                    `Network: ${wd?.network}\n` +
                    `Address: ${wd?.address}\n` +
                    `Created: ${formatDateTime(wd?.createdAt)}\n` +
                    `${wd?.completedAt ? "Completed: " + formatDateTime(wd.completedAt) : ""}`;
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success("Withdrawal summary copied");
                  } catch {
                    toast.error("Copy failed");
                  }
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
}
