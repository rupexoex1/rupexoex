import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import OrderCard from "./order/OrderCard";

const Orders = () => {
  const { axios, token, loading } = useAppContext();
  const authReady = !loading && !!token;

  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!authReady) return; // 🔐 wait until token + axios header ready

    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const res = await axios.get("/api/v1/users/orders");
        if (res.data?.success && Array.isArray(res.data.orders)) {
          const sorted = [...res.data.orders].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          if (!cancelled) setOrders(sorted);
        } else {
          if (!cancelled) setOrders([]);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch orders", err);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, axios]);

  // ⏳ prevent first-render flicker + accidental 401
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-4">
        <h1 className="text-xl font-bold mb-4">My Orders</h1>
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }

  // (Route ko <RequireAuth> se wrap karna bhi zaroori hai)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-4">
        <h1 className="text-xl font-bold mb-4">My Orders</h1>
        <div className="text-gray-400">Please login to view your orders.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <h1 className="text-xl font-bold mb-4">My Orders</h1>

      {busy ? (
        <div className="text-gray-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400">No orders found</div>
      ) : (
        orders.map((order) => <OrderCard key={order._id} order={order} />)
      )}
    </div>
  );
};

export default Orders;
