import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import TransactionCard from "./TransactionCard";
import { useNavigate } from "react-router-dom";
import bot from "../../assets/static/bot.png";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 25; // safe default

export default function UserTransactions() {
  const { axios, token } = useAppContext();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

  const fetchPage = async (reset = false) => {
    if (!token) return;

    const nextPage = reset ? 1 : page;
    try {
      reset ? setInitialLoading(true) : setLoadingMore(true);
      setError("");

      // Try server-side pagination (page, limit). If backend ignores, it’ll still return array.
      const res = await axios.get("/api/v1/users/transactions", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const payload = res?.data || {};
      const list = Array.isArray(payload.transactions) ? payload.transactions : [];

      // If backend returns total/hasMore, use it; else infer hasMore by page size.
      const serverHasMore =
        typeof payload.hasMore === "boolean"
          ? payload.hasMore
          : list.length === PAGE_SIZE;

      // Merge (avoid duplicates on fast clicks)
      setItems((prev) => {
        const base = reset ? [] : prev;
        const map = new Map(base.map((t) => [t._id, t]));
        list.forEach((t) => map.set(t._id, t));
        // ensure newest first
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });

      setHasMore(serverHasMore);
      setPage(nextPage + 1);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load transactions";
      setError(msg);
      toast.error(msg);
      // If error on next pages, don’t advance page
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  // first load
  useEffect(() => {
    if (token) {
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchPage(true);
    } else {
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (initialLoading) {
    return <p className="text-white text-center mt-10">Loading...</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className="text-white text-center mt-10">
        <p className="mb-3">Couldn’t fetch transactions.</p>
        <button
          onClick={() => fetchPage(true)}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-secondary rounded-b-3xl py-5">
        <div className="flex justify-between items-center px-3">
          {/* Back + Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <p className="rich-text !text-xl mb-1">Recent USDT Transactions</p>
          </div>

          {/* Bot Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <a href="https://t.me/riorupexo" target="_blank" rel="noreferrer">
              <img src={bot} alt="Bot" className="w-10 h-10 cursor-pointer" />
            </a>
          </div>
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="mt-6 flex flex-col gap-4 items-center p-4">
        {items.length === 0 ? (
          <p className="text-white/80 mt-6">No transactions yet.</p>
        ) : (
          items.map((tx) => <TransactionCard key={tx._id} tx={tx} />)
        )}

        {/* Pagination control */}
        {items.length > 0 && (
          <div className="mt-2">
            {hasMore ? (
              <button
                disabled={loadingMore}
                onClick={() => fetchPage(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs text-white/60">All caught up</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
