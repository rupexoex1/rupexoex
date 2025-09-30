import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const ENDPOINT = "/api/v1/users/admin/transactions";

export default function TransactionHistory() {
  const { axios } = useAppContext();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
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

      const res = await axios.get(ENDPOINT, { params: { page: p, limit, q } });
      const payload = res?.data || {};

      // backend could return either `items` or `transactions`
      const list = payload.items || payload.transactions || [];

      // rows
      setRows((prev) => (reset ? list : [...prev, ...list]));

      // total (prefer server, else accumulate)
      if (typeof payload.total === "number") {
        setTotal(payload.total);
      } else {
        setTotal((prevTotal) => (reset ? list.length : prevTotal + list.length));
      }

      // hasMore (prefer server, else infer by page fill)
      const more = payload.hasMore ?? (list.length === limit);
      setHasMore(Boolean(more));

      setPage(p + 1);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch transactions";
      toast.error(`${status ? `(${status}) ` : ""}${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // first load + on search reset
  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    const match = (v) => String(v ?? "").toLowerCase().includes(s);
    return rows.filter((tx) =>
      match(tx?.userId?.email) ||
      match(tx?.from) ||
      match(tx?.txHash) ||
      match(tx?.forwardedTxId) ||
      match(tx?.status) ||
      match(tx?.amount) ||
      match(tx?.createdAt && new Date(tx.createdAt).toLocaleString())
    );
  }, [rows, q]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">All User Transactions</h2>
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            type="text"
            placeholder="Search email / txHash / from / status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-70 hover:opacity-100"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => load(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Showing {filtered.length} of {total || rows.length}
      </div>

      {loading && rows.length === 0 ? (
        <p className="p-4">Loading transactions…</p>
      ) : rows.length === 0 ? (
        <p className="p-4">No transactions found.</p>
      ) : (
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
              {filtered.map((tx) => (
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
      )}

      <div className="mt-3 flex items-center justify-center">
        {hasMore ? (
          <button
            disabled={loading}
            onClick={() => load(false)}
            className="px-4 py-2 bg-gray-700 rounded text-sm text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          <div className="text-xs opacity-60">All loaded</div>
        )}
      </div>
    </div>
  );
}
