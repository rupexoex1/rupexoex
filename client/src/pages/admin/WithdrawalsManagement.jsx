// src/pages/admin/WithdrawalsManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const statusBadge = (status) => {
  const base = "px-2 py-1 rounded text-xs font-medium";
  if (status === "approved") return `${base} bg-green-600`;
  if (status === "rejected") return `${base} bg-red-600`;
  return `${base} bg-yellow-500`;
};

const ConfirmModal = ({ open, variant = "success", title, message, onConfirm, onCancel, processing = false }) => {
  if (!open) return null;
  const v =
    variant === "danger"
      ? { ring: "ring-red-500/30", border: "border-red-600", header: "text-red-300", iconBg: "bg-red-600", btn: "bg-red-600 hover:bg-red-700" }
      : { ring: "ring-green-500/30", border: "border-green-600", header: "text-green-300", iconBg: "bg-green-600", btn: "bg-green-600 hover:bg-green-700" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-md mx-4 rounded-xl bg-[#0b1220] border ${v.border} ring-1 ${v.ring} p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 ${v.iconBg} rounded-full flex items-center justify-center text-white text-sm`}>!</div>
          <h3 className={`text-lg font-semibold ${v.header}`}>{title}</h3>
        </div>
        <p className="text-sm text-gray-300 mb-5 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={processing} className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={processing} className={`px-3 py-1.5 rounded text-white text-sm ${v.btn}`}>
            {processing ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function WithdrawalsManagement() {
  const { axios } = useAppContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [modal, setModal] = useState({ open: false, row: null, status: null });

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/users/admin/withdrawals");
      if (res.data?.success) setRows(res.data.withdrawals || []);
      else toast.error(res.data?.message || "Failed to fetch withdrawals");
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await axios.put(`/api/v1/users/admin/withdrawals/${id}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Withdrawal ${newStatus}`);
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: newStatus, completedAt: new Date().toISOString() } : r)));
      } else {
        toast.error(res.data?.message || "Failed to update");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to update";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!debounced) return rows;
    const match = (v) => String(v ?? "").toLowerCase().includes(debounced);
    return rows.filter((r) =>
      match(r?._id) ||
      match(r?.address) ||
      match(r?.status) ||
      match(r?.amount) ||
      match(r?.createdAt && new Date(r.createdAt).toLocaleString())
    );
  }, [rows, debounced]);

  const openModal = (row, status) => setModal({ open: true, row, status });
  const closeModal = () => setModal({ open: false, row: null, status: null });
  const confirmModal = async () => {
    if (!modal.row || !modal.status) return;
    await updateStatus(modal.row._id, modal.status);
    closeModal();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">💸 Withdrawals</h1>
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by id, address, status…"
            className="w-full rounded-md bg-[#1e293b] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          )}
        </div>
        <button onClick={fetchRows} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">Refresh</button>
      </div>

      <div className="text-xs opacity-70 mb-2">Showing {filtered.length} of {rows.length}</div>

      {loading ? (
        <div className="text-center">Loading…</div>
      ) : (
        <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#334155] text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Req#</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Network</th>
                <th className="px-4 py-3">USDT</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Create time</th>
                <th className="px-4 py-3">Completion Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filtered.map((r) => {
                const isPending = r.status === "pending";
                const disabled = !isPending || updatingId === r._id;
                return (
                  <tr key={r._id}>
                    <td className="px-4 py-3">{r._id?.slice(-6)}</td>
                    <td className="px-4 py-3 break-all">{r.address}</td>
                    <td className="px-4 py-3">{r.network || "TRC20"}</td>
                    <td className="px-4 py-3">USDT {r.amount}</td>
                    <td className="px-4 py-3">${Number(r.feeUSD ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={disabled}
                            onClick={() => openModal(r, "approved")}
                            className="px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={disabled}
                            onClick={() => openModal(r, "rejected")}
                            className="px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {updatingId === r._id && <span className="text-xs opacity-70">Saving…</span>}
                        </div>
                      ) : (
                        <span className="text-xs opacity-70">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "--"}</td>
                    <td className="px-4 py-3">{r.completedAt ? new Date(r.completedAt).toLocaleString() : "--"}</td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm opacity-70" colSpan={9}>No matching withdrawals.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={modal.open}
        variant={modal.status === "rejected" ? "danger" : "success"}
        title={modal.status === "rejected" ? "Reject withdrawal?" : "Approve withdrawal?"}
        message={
          modal.row
            ? `Request #${modal.row._id.slice(-6)}\nUSDT ${modal.row.amount}\n\nThis action is permanent and can be performed only once.`
            : ""
        }
        onCancel={closeModal}
        onConfirm={confirmModal}
        processing={!!updatingId}
      />
    </div>
  );
}
