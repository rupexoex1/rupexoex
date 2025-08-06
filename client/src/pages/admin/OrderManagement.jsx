import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const OrderManagement = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/v1/users/admin/orders");
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`/api/v1/users/admin/orders/${orderId}`, {
        status: newStatus,
      });

      if (res.data.success) {
        toast.success("Status updated");
        fetchOrders(); // refresh
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <h1 className="text-xl font-bold mb-4 text-center">🧾 Orders Management</h1>

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
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Acc Info</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Create time</th>
                <th className="px-4 py-3">Completion Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3">{order._id.slice(-6)}</td>
                  <td className="px-4 py-3">{order.plan}</td>
                  <td className="px-4 py-3">{order.price}</td>
                  <td className="px-4 py-3">USDT {order.amount}</td>
                  <td className="px-4 py-3">INR {order.inrAmount}</td>
                  <td className="px-4 py-3 whitespace-pre-line">
                    Name: {order.bankAccount?.accountHolder || "N/A"}
                    {"\n"}AC No: {order.bankAccount?.accountNumber || "N/A"}
                    {"\n"}IFSC: {order.bankAccount?.ifsc || "N/A"}
                    {"\n"}Bank Name: {order.bankAccount?.bankName || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium ${order.status === "confirmed"
                          ? "bg-green-600"
                          : order.status === "failed"
                            ? "bg-red-600"
                            : "bg-yellow-500"
                        }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {order.completedAt
                      ? new Date(order.completedAt).toLocaleString()
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
