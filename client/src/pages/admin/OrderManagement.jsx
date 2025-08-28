import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

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

  const v = variant === "danger"
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md mx-4 rounded-xl bg-[#0b1220] border ${v.border} ring-1 ${v.ring} p-5`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 ${v.iconBg} rounded-full flex items-center justify-center text-white text-sm`}>
            !
          </div>
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

const OrderManagement = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // modal state
  const [modal, setModal] = useState({
    open: false,
    order: null,
    status: null, // 'confirmed' | 'failed'
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/users/admin/orders");
      if (res.data.success) setOrders(res.data.orders);
      else toast.error(res.data.message || "Failed to fetch orders");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await axios.put(`/api/v1/users/admin/orders/${orderId}`, {
        status: newStatus,
      });
      if (res.data.success) {
        toast.success(`Order ${newStatus}`);
        await fetchOrders();
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to update status";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const openModal = (order, status) => {
    setModal({ open: true, order, status });
  };

  const closeModal = () => setModal({ open: false, order: null, status: null });

  const confirmModal = async () => {
    if (!modal.order || !modal.status) return;
    await updateStatus(modal.order._id, modal.status);
    closeModal();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🧾 Orders Management</h1>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center">Loading orders...</div>
      ) : (
        <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#334155] text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Order#</th>
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
              {orders.map((order) => {
                const isPending = order.status === "pending";
                const disabled = !isPending || updatingId === order._id;

                return (
                  <tr key={order._id} className="align-top">
                    <td className="px-4 py-3">{order._id.slice(-6)}</td>
                    <td className="px-4 py-3">{order.plan}</td>
                    <td className="px-4 py-3">{order.price}</td>
                    <td className="px-4 py-3">USDT {order.amount}</td>
                    <td className="px-4 py-3">INR {order.inrAmount}</td>
                    <td className="px-4 py-3 whitespace-pre-line">
                      Name: {order.bankAccount?.holderName || "N/A"}
                      {"\n"}AC No: {order.bankAccount?.accountNumber || "N/A"}
                      {"\n"}IFSC: {order.bankAccount?.ifsc || "N/A"}
                      {"\n"}Bank: {order.bankAccount?.bankName || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={disabled}
                            onClick={() => openModal(order, "confirmed")}
                            className="px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            disabled={disabled}
                            onClick={() => openModal(order, "failed")}
                            className="px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            Fail
                          </button>
                          {updatingId === order._id && (
                            <span className="text-xs opacity-70">Saving…</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs opacity-70">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      {order.completedAt
                        ? new Date(order.completedAt).toLocaleString()
                        : "--"}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm opacity-70" colSpan={10}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Themed modal */}
      <ConfirmModal
        open={modal.open}
        variant={modal.status === "failed" ? "danger" : "success"}
        title={
          modal.status === "failed"
            ? "Mark order as FAILED?"
            : "Confirm this order?"
        }
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
};

export default OrderManagement;
