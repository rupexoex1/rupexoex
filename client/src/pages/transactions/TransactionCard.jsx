import React from "react";

const TransactionCard = ({ tx }) => {
  const {
    amount,
    txHash,
    createdAt,
    status,
    from,
  } = tx;

  const isCompleted = status === "forwarded" || status === "completed";

  return (
    <div className="bg-[#121212] text-white rounded-xl p-4 shadow-lg w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-[#1a1a2e] px-3 py-1 rounded text-sm font-semibold">Deposited</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">USDT</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-60">Amount</p>
            <p className="text-lg font-semibold">{amount.toFixed(2)} USDT</p>
          </div>
          <div className={`px-3 py-1 rounded text-sm font-medium ${isCompleted ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
            {isCompleted ? "Completed" : "Pending"}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 flex justify-between text-sm opacity-80 gap-6">
        <div>
          <p>Transaction ID</p>
          <p className="text-xs break-all">{txHash}</p>
        </div>
        <div className="text-right">
          <p>Date</p>
          <p>{new Date(createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
