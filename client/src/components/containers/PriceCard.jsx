// components/PriceCard.jsx
import React from 'react';

const PriceCard = ({ type, price, bgColor }) => {
  return (
    <div className="bg-[#151d2e] rounded-lg p-4 mb-4 text-white shadow relative">
      <h1>{price}₹</h1>
      <div className="flex justify-between items-center">
        <span className="text-white text-xs px-2 py-1 rounded"
          style={{ backgroundColor: bgColor }}>
          {type}
        </span>
        <button className="text-white text-l font-light">USDT</button>
      </div>
      <p className="text-sm mt-1">1 USDT = {price}₹</p>
      <button className="mt-4 w-full hover:bg-blue-700 text-white py-2 rounded font-semibold" style={{backgroundColor: bgColor}}>
        Select
      </button>
    </div>
  );
};

export default PriceCard;
