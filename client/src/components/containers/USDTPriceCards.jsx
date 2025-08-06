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
    setSelectedPlan, // ✅ using global context
  } = useAppContext();

  const navigate = useNavigate();

  const handleSelect = (plan) => {
    setSelectedPlan((prev) => (prev === plan ? null : plan)); // Toggle selection
  };

  const handleSellClick = () => {
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

  return (
    <div className="bg-secondary min-h-screen flex flex-col items-center justify-center rounded-xl px-4 mt-4">
      <h1 className='mb-4 text-white text-2xl font-bold'>OUR PLANS</h1>

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
            onClick={handleSellClick}
            className={`w-[50%] text-white py-2 rounded font-semibold mt-2 transition-all duration-200 ${selectedPlan ? 'bg-[#30B0C7] cursor-pointer' : 'bg-gray-600 cursor-not-allowed'
              }`}
          >
            Sell USDT
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <NavLink to="/deposit" className="flex flex-col items-center text-white hover:text-blue-400">
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
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default USDTPriceCards;
