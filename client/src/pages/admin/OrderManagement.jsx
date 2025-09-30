import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

/* -------------------- UI helpers -------------------- */
const statusBadge = (status) => {
  const base = "px-2 py-1 rounded text-xs font-medium";
  if (status === "confirmed") return `${base} bg-green-600`;
  if (status === "failed") return `${base} bg-red-600`;
  return `${base} bg-yellow-500`;
};

const ConfirmModal = ({
  open,
  variant = "success", // 'success' | 'danger'
  title,
  message,
  onConfirm,
  onCancel,
  processing = false,
}) => {
  if (!open) return null;

  const v =
    variant === "danger"
      ? {
          ring: "ring-red-500/30",
          border: "border-red-600",
          header: "text-red-300",
          iconBg: "bg-red-600",
          btn: "bg-red-600 hover:bg-red-700",
        }
      : {
          ring: "ring-green-500/30",
          border: "border-green-600",
          header: "text-green-300",
          iconBg: "bg-green-600",
          btn: "bg-green-600 hover:bg-green-700",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md mx-4 rounded-xl bg-[#0b1220] border ${v.border} ring-1 ${v.ring} p-5`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 ${v.iconBg} rounded-full flex items-center justify-center text-white text-sm`}>!</div>
          <h3 className={`text-lg font-semibold ${v.header}`}>{title}</h3>
        </div>
        <p className="text-sm text-gray-300 mb-5 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`px-3 py-1.5 rounded text-white text-sm ${v.btn}`}
          >
            {processing ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------- Page -------------------- */
export default function OrderManagement() {
  const { axios } = useAppContext();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // modal state
  const [modal, setModal] = useState({ open: false, order: null, status: null });

  // search (debounced)
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;

      const res = await axios.get("/api/v1/users/admin/orders", {
        params: { page: p, limit, q },
      });

      // Support both {orders} and {items}
      const payload = res?.data || {};
      const list = payload.orders || payload.items || [];

      setRows((prev) => (reset ? list : [...prev, ...list]));

      if (typeof payload.total === "number") {
        setTotal(payload.total);
      } else {
        setTotal((prevTotal) => (reset ? list.length : prevTotal + list.length));
      }

      const more = payload.hasMore ?? (list.length === limit);
      setHasMore(Boolean(more));

      setPage(p + 1);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch orders";
      toast.error(`${status ? `(${status}) ` : ""}${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // first load + on search change reset
  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await axios.put(`/api/v1/users/admin/orders/${orderId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order ${newStatus}`);
        setRows((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus, completedAt: new Date().toISOString() } : o
          )
        );
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // helpers (now actually used)
  const openModal = (order, status) => setModal({ open: true, order, status });
  const closeModal = () => setModal({ open: false, order: null, status: null });
  const confirmModal = async () => {
    if (!modal.order || !modal.status) return;
    await updateStatus(modal.order._id, modal.status);
    closeModal();
  };

  // client-side filter (light)
  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    const match = (v) => String(v ?? "").toLowerCase().includes(s);
    return rows.filter((o) => {
      const ba = o.bankAccount || {};
      return (
        match(o?._id) ||
        match(o?.status) ||
        match(o?.plan) ||
        match(o?.price) ||
        match(o?.amount) ||
        match(o?.inrAmount) ||
        match(o?.user?.email) ||
        match(ba?.accountHolder) ||
        match(ba?.accountNumber) ||
        match(ba?.ifsc)
      );
    });
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      {/* Header + Search + Refresh */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">🧾 Orders Management</h1>

        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: Order#, status, plan, AC no, IFSC…"
            className="w-full rounded-md bg-[#1e293b] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-70 hover:opacity-100"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <button onClick={() => load(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">Showing {filtered.length} of {total || rows.length}</div>

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="text-center">Loading orders…</div>
      ) : (
        <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#334155] text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Order#</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">USDT</th>
                <th className="px-4 py-3">INR</th>
                <th className="px-4 py-3">Acc Info</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Create time</th>
                <th className="px-4 py-3">Completion Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filtered.map((o) => {
                const isPending = o.status === "pending";
                const disabled = !isPending || updatingId === o._id;
                const ba = o.bankAccount || {};
                return (
                  <tr key={o._id} className="align-top">
                    <td className="px-4 py-3">{o._id?.slice(-6)}</td>
                    <td className="px-4 py-3">{o.user?.email || "—"}</td>
                    <td className="px-4 py-3">{o.plan}</td>
                    <td className="px-4 py-3">{o.price}</td>
                    <td className="px-4 py-3">USDT {o.amount}</td>
                    <td className="px-4 py-3">INR {o.inrAmount}</td>
                    <td className="px-4 py-3 whitespace-pre-line">
                      {`Name: ${ba.accountHolder ?? "N/A"}\nAC No: ${ba.accountNumber ?? "N/A"}\nIFSC: ${ba.ifsc ?? "N/A"}`}
                    </td>
                    <td className="px-4 py-3"><span className={statusBadge(o.status)}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={disabled}
                            onClick={() => openModal(o, "confirmed")}
                            className="px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            disabled={disabled}
                            onClick={() => openModal(o, "failed")}
                            className="px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            Fail
                          </button>
                          {updatingId === o._id && <span className="text-xs opacity-70">Saving…</span>}
                        </div>
                      ) : (
                        <span className="text-xs opacity-70">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "--"}</td>
                    <td className="px-4 py-3">{o.completedAt ? new Date(o.completedAt).toLocaleString() : "--"}</td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm opacity-70" colSpan={11}>
                    No matching orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination footer */}
      <div className="mt-3 flex items-center justify-center">
        {hasMore ? (
          <button
            disabled={loading}
            onClick={() => load(false)}
            className="px-4 py-2 bg-gray-700 rounded text-sm disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          <div className="text-xs opacity-60">All loaded</div>
        )}
      </div>

      {/* Confirm Modal (helpers used → no ESLint warnings) */}
      <ConfirmModal
        open={modal.open}
        variant={modal.status === "failed" ? "danger" : "success"}
        title={modal.status === "failed" ? "Mark order as FAILED?" : "Confirm this order?"}
        message={
          modal.order
            ? `Order #${modal.order._id.slice(-6)}\nUSDT ${modal.order.amount} → INR ${modal.order.inrAmount}\n\nThis action is permanent and can be performed only once.`
            : ""
        }
        onCancel={closeModal}
        onConfirm={confirmModal}
        processing={!!updatingId}
      />
    </div>
  );
}
