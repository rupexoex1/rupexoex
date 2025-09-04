import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

const RateManagement = () => {
  const {
    basicPrice,
    vipPrice,
    basicMin,
    basicMax,
    vipMin,
    setBasicPrice,
    setVipPrice,
    setBasicMin,
    setBasicMax,
    setVipMin,
    axios,
    fetchPricesFromBackend,
  } = useAppContext();

  const [newBasic, setNewBasic] = useState(basicPrice);
  const [newVip, setNewVip] = useState(vipPrice);
  const [nbMin, setNbMin] = useState(basicMin);
  const [nbMax, setNbMax] = useState(basicMax);
  const [nvMin, setNvMin] = useState(vipMin);

  const [status, setStatus] = useState("");

  useEffect(() => {
    setNewBasic(basicPrice);
    setNewVip(vipPrice);
    setNbMin(basicMin);
    setNbMax(basicMax);
    setNvMin(vipMin);
  }, [basicPrice, vipPrice, basicMin, basicMax, vipMin]);

  const handleUpdate = async () => {
    // basic sanity checks
    const bMin = Number(nbMin);
    const bMax = Number(nbMax);
    const vMin = Number(nvMin);

    if (Number.isNaN(bMin) || Number.isNaN(bMax) || Number.isNaN(vMin)) {
      setStatus("All limits must be valid numbers ❌");
      return;
    }
    if (bMin >= bMax) {
      setStatus("Basic Min must be less than Basic Max ❌");
      return;
    }
    if (vMin <= bMax) {
      setStatus("VIP Min should be greater than Basic Max ❌");
      return;
    }

    try {
      const payload = {
        basic: String(newBasic),
        vip: String(newVip),
        basicMin: bMin,
        basicMax: bMax,
        vipMin: vMin,
      };

      // ✅ Correct admin endpoint
      const res = await axios.put("/api/v1/admin/rates", payload);

      if (res.data?.success) {
        // Update local context optimistically
        setBasicPrice(payload.basic);
        setVipPrice(payload.vip);
        setBasicMin(payload.basicMin);
        setBasicMax(payload.basicMax);
        setVipMin(payload.vipMin);

        // Re-fetch from backend as single source of truth
        await fetchPricesFromBackend();

        setStatus("Prices & plan limits updated successfully ✅");
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus(res.data?.message || "Failed to update prices ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update prices ❌";
      setStatus(msg);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-[#151d2e] rounded-lg shadow text-white">
      <h2 className="text-xl font-semibold mb-4">Rate &amp; Plan Management</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm">Basic Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={newBasic}
            onChange={(e) => setNewBasic(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">VIP Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={newVip}
            onChange={(e) => setNewVip(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Basic Min (USDT)</label>
          <input
            type="number"
            value={nbMin}
            onChange={(e) => setNbMin(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Basic Max (USDT)</label>
          <input
            type="number"
            value={nbMax}
            onChange={(e) => setNbMax(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>

        <div className="col-span-2">
          <label className="block mb-1 text-sm">VIP Min (USDT)</label>
          <input
            type="number"
            value={nvMin}
            onChange={(e) => setNvMin(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
      </div>

      <button
        onClick={handleUpdate}
        className="w-full py-2 mt-4 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
      >
        Update
      </button>

      {status && (
        <p className="mt-2 text-sm font-light">
          {status.includes("✅") ? (
            <span className="text-green-400">{status}</span>
          ) : (
            <span className="text-red-400">{status}</span>
          )}
        </p>
      )}
    </div>
  );
};

export default RateManagement;
