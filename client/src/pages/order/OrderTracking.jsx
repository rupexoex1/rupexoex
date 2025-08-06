import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

const OrderTracking = () => {
  const { id } = useParams();
  const { axios } = useAppContext();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/api/v1/users/orders/${id}`);
      if (res.data.success) setOrder(res.data.order);
    };
    fetchOrder();
  }, [id]);

  if (!order) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="text-white p-6">
      <h2 className="text-xl font-bold mb-4">Order Status</h2>
      <p>Amount: {order.amount} USDT</p>
      <p>Status: <span className={`font-bold ${order.status === 'pending' ? 'text-yellow-400' : order.status === 'confirmed' ? 'text-green-400' : 'text-red-400'}`}>{order.status}</span></p>
      <p>Received INR: ₹ {order.inrAmount}</p>
      <p>Payee: {order.bankAccount?.accountHolder}</p>
    </div>
  );
};

export default OrderTracking;