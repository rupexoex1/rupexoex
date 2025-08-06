import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OrderCard from './order/OrderCard';

const Orders = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/v1/users/orders");
        if (res.data.success) {
          setOrders(res.data.orders.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };

    fetchOrders();
  }, [axios]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <h1 className="text-xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400">No orders found</div>
      ) : (
        orders.map(order => <OrderCard key={order._id} order={order} />)
      )}
    </div>
  );
};

export default Orders;
