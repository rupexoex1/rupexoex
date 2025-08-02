import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext'; // ✅ adjust path if needed

const RateManagement = () => {
  const {
    basicPrice,
    vipPrice,
    setBasicPrice,
    setVipPrice,
    axios,
    fetchPricesFromBackend,
  } = useAppContext();

  const [newBasic, setNewBasic] = useState(basicPrice);
  const [newVip, setNewVip] = useState(vipPrice);
  const [status, setStatus] = useState('');

  // Sync local input fields when prices change in context
  useEffect(() => {
    setNewBasic(basicPrice);
    setNewVip(vipPrice);
  }, [basicPrice, vipPrice]);

  const handleUpdate = async () => {
    try {
      const res = await axios.put('/api/v1/users/rates', {
        basic: newBasic,
        vip: newVip,
      });

      if (res.data.success) {
        setBasicPrice(newBasic);
        setVipPrice(newVip);
        fetchPricesFromBackend(); // ✅ refresh context from backend
        setStatus('Prices updated successfully ✅');
        setTimeout(() => setStatus(''), 3000); // auto-clear
      }
    } catch (err) {
      console.error('Update error:', err);
      setStatus('Failed to update prices ❌');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-[#151d2e] rounded-lg shadow text-white">
      <h2 className="text-xl font-semibold mb-4">Rate Management</h2>

      <div className="mb-4">
        <label className="block mb-1">Basic Price (₹)</label>
        <input
          type="number"
          value={newBasic}
          onChange={(e) => setNewBasic(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
          step="0.01"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">VIP Price (₹)</label>
        <input
          type="number"
          value={newVip}
          onChange={(e) => setNewVip(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
          step="0.01"
        />
      </div>

      <button
        onClick={handleUpdate}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
      >
        Update Rates
      </button>

      {status && (
        <p className="mt-2 text-sm text-green-400 font-light">{status}</p>
      )}
    </div>
  );
};

export default RateManagement;
