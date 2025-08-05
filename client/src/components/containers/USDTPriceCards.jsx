// components/USDTPriceCards.jsx
import React from 'react';
import PriceCard from './PriceCard';
import { useAppContext } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';

const USDTPriceCards = () => {
  const { basicPrice, vipPrice } = useAppContext();
  return (
    <div className="bg-secondary min-h-screen flex flex-col items-center justify-center rounded-xl px-4 mt-4">
      <h1 className='mb-4'>OUR PLANS</h1>
      <div className="w-full max-w-xs">
        <PriceCard type="Basic" price={basicPrice} range="100$ - 5000$" bgColor="#156BF4" />
        <PriceCard type="VIP" price={vipPrice} range="+5000$" bgColor="#F8C630" />

        <div className='flex justify-center'>
          <button className="w-[50%] text-white py-2 rounded font-semibold mt-2" style={{ backgroundColor: "#30B0C7" }}>
            Sell USDT
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <NavLink to={"/deposit"} className="flex flex-col items-center text-white hover:text-blue-400">
            <div className="bg-[#1e293b] p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
