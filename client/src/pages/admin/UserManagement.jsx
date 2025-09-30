import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const USERS_WITH_BAL_ENDPOINT = "/api/v1/users/admin/users-with-balance";
const USERS_FALLBACK_ENDPOINT = "/api/v1/users/admin/users";
const BLOCK_TOGGLE_ENDPOINT = (id) => `/api/v1/users/admin/users/${id}/block`;

export default function UserManagement() {
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

  const fmt = (n) =>
    n === undefined || n === null
      ? "—"
      : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        Number(n)
      );

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;

      // try batch endpoint first
      let res;
      try {
        res = await axios.get(USERS_WITH_BAL_ENDPOINT, { params: { page: p, limit, q } });
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
        // fallback: plain users list
        res = await axios.get(USERS_FALLBACK_ENDPOINT, { params: { page: p, limit, q } });
      }

      const payload = res?.data || {};
      const list = payload.users || payload.items || [];

      // rows
      setRows((prev) => (reset ? list : [...prev, ...list]));

      // total
      if (typeof payload.total === "number") {
        setTotal(payload.total);
      } else {
        setTotal((prevTotal) => (reset ? list.length : prevTotal + list.length));
      }

      // hasMore (fallback: assume more if we got a full page)
      const more = payload.hasMore ?? (list.length === limit);
      setHasMore(Boolean(more));

      setPage(p + 1);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch users";
      toast.error(`${status ? `(${status}) ` : ""}${msg}`);
    } finally {
      setLoading(false);
    }
  };


  // first load + whenever q changes -> reset
  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleBlock = async (u, next) => {
    const prev = !!u?.blocked;
    // optimistic
    setRows((L) => L.map((x) => (x._id === u._id ? { ...x, blocked: next } : x)));
    try {
      const reason = next ? prompt("Reason (optional):", u?.blockedReason || "") : "";
      await axios.patch(BLOCK_TOGGLE_ENDPOINT(u._id), { blocked: next, reason });
      toast.success(next ? "User blocked" : "User unblocked");
    } catch (e) {
      setRows((L) => L.map((x) => (x._id === u._id ? { ...x, blocked: prev } : x)));
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">👥 User Management</h1>

        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email / phone …"
            className="w-full rounded-md bg-[#1e293b] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
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

        <button onClick={() => load(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">Showing {rows.length} of {total || rows.length}</div>

      <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-[#334155] text-white uppercase text-xs">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Available Balance</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Blocked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {rows.map((u, i) => (
              <tr key={u._id || `${u.email}-${i}`}>
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 break-all">{u.email || "—"}</td>
                <td className="px-4 py-3">{u.phone || "—"}</td>
                <td className="px-4 py-3">{fmt(u.availableBalance ?? u.balance)}</td>
                <td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-blue-600"
                      checked={!!u.blocked}
                      onChange={(e) => toggleBlock(u, e.target.checked)}
                    />
                    <span className={`text-xs ${u.blocked ? "text-red-400" : "text-green-400"}`}>
                      {u.blocked ? "Blocked" : "Active"}
                    </span>
                  </label>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-sm opacity-70" colSpan={6}>No users.</td></tr>
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
