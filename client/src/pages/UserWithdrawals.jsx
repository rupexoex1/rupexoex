import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import WithdrawCard from "../components/cards/WithdrawCard";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 20; // safe default

const UserWithdrawals = () => {
  const { axios } = useAppContext();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // detect mode: 'server' (real pagination) or 'client' (slice local array)
  const [mode, setMode] = useState(null);
  const allRef = useRef(null); // holds full array in client mode

  const fetchPage = async (reset = false) => {
    const nextPage = reset ? 1 : page;
    try {
      reset ? setInitialLoading(true) : setLoadingMore(true);

      const res = await axios.get("/api/v1/users/withdrawals", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const payload = res?.data || {};
      const list = Array.isArray(payload.withdrawals) ? payload.withdrawals : [];

      // If API returns hasMore/total, treat as server pagination
      const serverHasMore =
        typeof payload.hasMore === "boolean"
          ? payload.hasMore
          : (typeof payload.total === "number"
              ? nextPage * PAGE_SIZE < Number(payload.total)
              : undefined);

      if (serverHasMore !== undefined) {
        // ---- server mode ----
        if (reset) {
          setRows(list);
        } else {
          setRows((prev) => [...prev, ...list]);
        }
        setMode("server");
        setHasMore(Boolean(serverHasMore ?? list.length === PAGE_SIZE));
        setPage(nextPage + 1);
      } else {
        // ---- client mode (full array returned) ----
        if (reset || !allRef.current) {
          allRef.current = list;
        }
        const start = (nextPage - 1) * PAGE_SIZE;
        const slice = allRef.current.slice(start, start + PAGE_SIZE);

        if (reset) setRows(slice);
        else setRows((prev) => [...prev, ...slice]);

        setMode("client");
        setHasMore(start + PAGE_SIZE < allRef.current.length);
        setPage(nextPage + 1);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load withdrawals";
      toast.error(msg);
      // if it was a load-more, don't advance page
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  // first load
  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    setMode(null);
    allRef.current = null;
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    setMode(null);
    allRef.current = null;
    fetchPage(true);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">💸 My Withdrawals</h1>
        <button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">
        Showing {rows.length}{mode === "client" && allRef.current ? ` / ${allRef.current.length}` : ""}
      </div>

      {initialLoading ? (
        <div className="text-center opacity-80">Loading withdrawals…</div>
      ) : rows.length === 0 ? (
        <div className="text-center opacity-80">No withdrawals yet.</div>
      ) : (
        <>
          <div>
            {rows.map((wd) => (
              <WithdrawCard key={wd._id} wd={wd} />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center">
            {hasMore ? (
              <button
                disabled={loadingMore}
                onClick={() => fetchPage(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <div className="text-xs opacity-60">All loaded</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserWithdrawals;
