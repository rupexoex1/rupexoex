import React from 'react';
import PriceCard from './PriceCard';
import { useAppContext } from '../../context/AppContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const USDTPriceCards = () => {
  const {
    basicPrice,
    vipPrice,
    selectedPlan,
    setSelectedPlan,
    token, // ✅ Get token from context
  } = useAppContext();

  const navigate = useNavigate();

  const handleSelect = (plan) => {
    setSelectedPlan((prev) => (prev === plan ? null : plan));
  };

  const handleSellClick = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!selectedPlan) {
      toast.error("Select Plan First");
      return;
    }

    const selectedPrice = selectedPlan === 'Basic' ? basicPrice : vipPrice;

    navigate('/sell', {
      state: {
        plan: selectedPlan,
        price: selectedPrice,
      },
    });
  };

  const handleDepositClick = (e) => {
    e.preventDefault(); // prevent NavLink default
    if (!token) {
      navigate("/login");
    } else {
      navigate("/deposit");
    }
  };

  return (
    <div className="bg-secondary flex flex-col items-center justify-center rounded-xl px-4 py-4 mb-4">

      <div className="w-full max-w-xs">
        <PriceCard
          type="Basic"
          price={basicPrice}
          range="100$ - 5000$"
          bgColor="#156BF4"
          isSelected={selectedPlan === 'Basic'}
          onSelect={() => handleSelect('Basic')}
        />

        <PriceCard
          type="VIP"
          price={vipPrice}
          range="+5000$"
          bgColor="#F8C630"
          isSelected={selectedPlan === 'VIP'}
          onSelect={() => handleSelect('VIP')}
        />

        <div className='flex justify-center'>
          <button
            onClick={handleDepositClick}
            className={`w-[50%] text-white py-2 rounded font-semibold mt-2 transition-all duration-200 ${selectedPlan ? 'bg-[#30B0C7] cursor-pointer' : 'bg-red-800 cursor-not-allowed'
              }`}
          >
            Deposit
          </button>

        </div>

        <div className="mt-4 gap-2 px-4 flex justify-center">
          {/* <button
            onClick={handleDepositClick}
            className="flex flex-col items-center text-white hover:text-blue-400"
          >
            <div className="bg-[#1e293b] p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm mt-1">Deposit</span>
          </button> */}

          {/* <button
            onClick={handleDepositClick}
            className={`w-[50%] text-white text-sm py-2 rounded font-semibold mt-2 transition-all duration-200 ${selectedPlan ? 'bg-[#30B0C7] cursor-pointer' : 'bg-red-800 cursor-not-allowed'
              }`}
          >
            Deposit
          </button> */}

          {/* <button
            onClick={handleSellClick}
            className={`w-[50%] text-white text-sm py-2 rounded font-semibold mt-2 transition-all duration-200 ${selectedPlan ? 'bg-[#30B0C7] cursor-pointer' : 'bg-red-800  cursor-not-allowed'
              }`}
          >
            Sell USDT
          </button> */}

          <button
            onClick={handleDepositClick}
            className="flex flex-col items-center text-white hover:text-blue-400"
          >
            <div className="bg-[#1e293b] p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm mt-1">Sell USDT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default USDTPriceCards;
