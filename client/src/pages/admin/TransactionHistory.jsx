import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

const TransactionHistory = () => {
  const { axios } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllTransactions = async () => {
    try {
      const res = await axios.get("/api/v1/users/admin/transactions");
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error("Error fetching admin transactions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) =>
    tx.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-4">Loading all transactions...</p>;
  if (transactions.length === 0) return <p className="p-4">No transactions found.</p>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">All User Transactions</h2>
        <input
          type="text"
          placeholder="Search by user email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">User Email</th>
              <th className="px-4 py-2">Amount (USDT)</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">TxHash</th>
              <th className="px-4 py-2">ForwardedTx</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx._id} className="border-t">
                <td className="px-4 py-2">{tx.userId?.email || "N/A"}</td>
                <td className="px-4 py-2">{tx.amount}</td>
                <td className="px-4 py-2 text-xs break-all">{tx.from}</td>
                <td className="px-4 py-2 text-xs break-all">{tx.txHash}</td>
                <td className="px-4 py-2 text-xs break-all">{tx.forwardedTxId || "N/A"}</td>
                <td className="px-4 py-2 capitalize">{tx.status}</td>
                <td className="px-4 py-2">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionHistory
