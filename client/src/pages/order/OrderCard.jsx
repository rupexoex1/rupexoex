import React from 'react';
import { Repeat } from 'lucide-react'; // You can use any refresh icon or replace with svg
import { useNavigate } from 'react-router-dom';

const OrderCard = ({ order }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-black';
      case 'confirmed': return 'bg-green-600';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      className="bg-[#1e293b] rounded-xl p-4 text-white shadow-lg mb-4 cursor-pointer hover:bg-[#27374a] transition"
      onClick={() => navigate(`/order-tracking/${order._id}`)}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold">{order.orderId}</span>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="text-xs space-y-2">
        <div className="flex justify-between">
          <span>Account No</span>
          <span className="font-medium">{order.bankAccount.accountNumber}</span>
        </div>

        <div className="flex justify-between">
          <span>Trade detail</span>
          <span className="flex items-center gap-2">
            {order.amount} USDT
            <Repeat className="w-3 h-3 text-blue-400" />
            {order.inrAmount} ₹
          </span>
        </div>

        <div className="flex justify-between">
          <span>Create time</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
