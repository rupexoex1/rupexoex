import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

export default function TransactionHistory() {
  const { axios } = useAppContext();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;
      const res = await axios.get("/api/v1/users/admin/transactions", {
        params: { page: p, limit, q },
      });
      const list = res?.data?.transactions || res?.data?.items || [];
      setRows((prev) => (reset ? list : [...prev, ...list]));
      setTotal(Number(res?.data?.total || (reset ? list.length : prev.length + list.length)));
      setHasMore(Boolean(res?.data?.hasMore));
      setPage(p + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([]); setPage(1); setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">All User Transactions</h2>
        <input
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Search by email / hash …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="text-xs opacity-70 mb-2">Showing {rows.length} of {total || rows.length}</div>

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
            {rows.map((tx) => (
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
            {!loading && rows.length === 0 && (
              <tr><td className="px-4 py-6 text-center" colSpan={7}>No transactions.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-center">
        {hasMore ? (
          <button disabled={loading} onClick={() => load(false)} className="px-4 py-2 bg-gray-700 rounded text-sm">
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          <div className="text-xs opacity-60">All loaded</div>
        )}
      </div>
    </div>
  );
}
