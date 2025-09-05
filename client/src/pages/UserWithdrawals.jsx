import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import WithdrawCard from "../components/cards/WithdrawCard";

const UserWithdrawals = () => {
  const { axios } = useAppContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/v1/users/withdrawals");
      if (res.data?.success) {
        setRows(res.data.withdrawals || []);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">💸 My Withdrawals</h1>
        <button onClick={fetchRows} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">
        Showing {rows.length}
      </div>

      {loading ? (
        <div className="text-center opacity-80">Loading withdrawals…</div>
      ) : rows.length === 0 ? (
        <div className="text-center opacity-80">No withdrawals yet.</div>
      ) : (
        <div>
          {rows.map((wd) => (
            <WithdrawCard key={wd._id} wd={wd} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserWithdrawals;