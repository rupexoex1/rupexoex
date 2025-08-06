import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const SellUSDT = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan, price, selectedAccount } = location.state || {};
  const { userBalance } = useAppContext();


  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [inrAmount, setInrAmount] = useState(0);

  // Redirect if user didn't come from selection page
  useEffect(() => {
    if (!plan || !price) {
      navigate('/');
    }
  }, [plan, price, navigate]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);

    const num = parseFloat(value);
    if (!value || isNaN(num)) {
      setError('Enter a valid number');
      setInrAmount(0);
      return;
    }

    if (plan === 'Basic' && (num < 100 || num > 5000)) {
      setError('Basic plan allows 100 to 5000 USDT only');
      setInrAmount(0);
      return;
    }

    if (plan === 'VIP' && num <= 5000) {
      setError('VIP plan allows more than 5000 USDT');
      setInrAmount(0);
      return;
    }

    if (num > userBalance) {
      setError('You cannot sell more than your available balance');
      setInrAmount(0);
      return;
    }

    setError('');
    setInrAmount(num * price);
  };

  const handleConfirm = () => {
    if (!amount || error) {
      toast.error('Fix errors before confirming');
      return;
    }

    toast.success(`Confirmed: ${amount} USDT = ₹${inrAmount}`);
    // Proceed to API or next step
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Exchange</h1>

      <button
        onClick={() => navigate('/select-payee')}
        className="w-full max-w-md mb-5 flex items-center justify-center gap-2 text-white border border-[#3b82f6] rounded-full py-2 px-4 hover:bg-[#1e293b] transition duration-200 cursor-pointer"
      >
        <span>Select Payee</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.953 9.953 0 0112 15c2.21 0 4.253.713 5.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>


      {/* Account Info */}
      {selectedAccount ? (
        <div className="bg-[#1e293b] w-full max-w-md rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Account No</span>
            <span className="font-semibold">{selectedAccount.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>IFSC</span>
            <span className="font-semibold">{selectedAccount.ifsc}</span>
          </div>
          <div className="flex justify-between">
            <span>Account Name</span>
            <span className="font-semibold">{selectedAccount.holderName}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-400 mb-4">No payee selected.</p>
      )}



      {/* Amount Input */}
      <div className="bg-[#1e293b] w-full max-w-md rounded-lg p-4 space-y-3 text-sm mb-4">
        <div className="flex items-center border border-gray-600 rounded px-2 py-2">
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="bg-transparent outline-none w-full text-white"
            placeholder="Enter USDT Amount"
          />
          <span className="text-blue-400 text-xs ml-2">USDT</span>
        </div>

        {error && <div className="text-red-400 text-xs">{error}</div>}

        <div className="flex justify-between items-center text-sm mt-1">
          <span>
            Available:{" "}
            <span className={`${userBalance < 100 ? 'text-red-400' : 'text-green-400'}`}>
              {userBalance?.toFixed(2)} USDT
            </span>
          </span>
          <span>
            1 USDT = <span className="text-green-400">{price} ₹</span>
          </span>
        </div>

        {userBalance < 100 && (
          <div className="text-red-400 text-xs mt-1">
            You cannot sell below 100 USDT
          </div>
        )}


        <div className="text-md font-semibold mt-1">
          You will receive: <span className="text-green-400">{inrAmount || 0} ₹</span>
        </div>
      </div>

      {/* Exchange Slabs UI */}
      <div className="bg-[#1e293b] w-full max-w-md rounded-lg p-4 text-xs space-y-2 mb-6">
        <div className="flex justify-between">
          <span>&gt;=1075.27 and &lt;2150.57</span>
          <span className="text-green-300">93 + 0.25</span>
        </div>
        <div className="flex justify-between">
          <span>&gt;=2150.54 and &lt;3225.81</span>
          <span className="text-green-300">93 + 0.5</span>
        </div>
        <div className="flex justify-between">
          <span>&gt;=3225.81</span>
          <span className="text-green-300">93 + 1</span>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!!error || !amount}
        className={`w-full max-w-md py-3 rounded font-semibold text-white ${!!error || !amount
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        Confirm
      </button>
    </div>
  );
};

export default SellUSDT;
