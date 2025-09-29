import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const USERS_WITH_BAL_ENDPOINT = "/api/v1/users/admin/users-with-balance";
const USERS_FALLBACK_ENDPOINT = "/api/v1/users/admin/users";
const USER_BALANCE_ENDPOINT = (id) => `/api/v1/users/admin/balance/${id}`;
const BLOCK_TOGGLE_ENDPOINT = (id) => `/api/v1/users/admin/users/${id}/block`;

const UserManagement = () => {
  const { axios, loading: appLoading } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const fmtNum = (n) => {
    if (n === null || n === undefined || n === "") return "--";
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n);
    return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const enrichBalances = async (list) => {
    // limited concurrency to avoid hammering server
    const CONCURRENCY = 5;
    const queue = [...list];
    const out = [];
    const run = async () => {
      while (queue.length) {
        const u = queue.shift();
        if (!u?._id) { out.push(u); continue; }
        try {
          const r = await axios.get(USER_BALANCE_ENDPOINT(u._id));
          out.push({ ...u, availableBalance: r?.data?.balance ?? null });
        } catch {
          out.push(u);
        }
      }
    };
    await Promise.all(new Array(CONCURRENCY).fill(0).map(run));
    return out;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Try batch endpoint first
      try {
        const res = await axios.get(USERS_WITH_BAL_ENDPOINT);
        if (res?.data?.success && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
          return;
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status && status !== 404) {
          // Real error except 404; show it
          toast.error(`(${status}) ${err?.response?.data?.message || err.message}`);
        }
        // if 404, we fall through to fallback below
      }

      // Fallback: get users, then per-user balance
      const res2 = await axios.get(USERS_FALLBACK_ENDPOINT);
      if (res2?.data?.success && Array.isArray(res2.data.users)) {
        const baseUsers = res2.data.users;
        const enriched = await enrichBalances(baseUsers);
        setUsers(enriched);
      } else {
        toast.error(res2?.data?.message || "Failed to fetch users");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch users";
      console.error("fetchUsers error:", { status, data: err?.response?.data, err });
      toast.error(`${status ? `(${status}) ` : ""}${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appLoading) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLoading]);

  const filtered = useMemo(() => {
    if (!debounced) return users;
    const match = (v) => String(v ?? "").toLowerCase().includes(debounced);
    return users.filter((u) => {
      const created = u?.createdAt ? new Date(u.createdAt).toLocaleString() : "";
      const bal = u?.availableBalance ?? u?.balance ?? u?.walletBalance ?? u?.funds ?? "";
      return match(u?.email) || match(u?.phone) || match(bal) || match(created);
    });
  }, [users, debounced]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">👥 User Management</h1>
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: email, phone, balance, created time…"
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
        <button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">Showing {filtered.length} of {users.length}</div>

      {loading ? (
        <div className="text-center">Loading users...</div>
      ) : (
        <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#334155] text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Available Balance</th>
                <th className="px-4 py-3">User Created Time</th>
                <th className="px-4 py-3">Blocked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filtered.map((u, idx) => {
                const balanceValue = u?.availableBalance ?? u?.balance ?? u?.walletBalance ?? u?.funds;
                return (
                  <tr key={u?._id || u?.email || idx} className="align-top">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 break-all">{u?.email || "--"}</td>
                    <td className="px-4 py-3">{u?.phone || "--"}</td>
                    <td className="px-4 py-3">{fmtNum(balanceValue)}</td>
                    <td className="px-4 py-3">{u?.createdAt ? new Date(u.createdAt).toLocaleString() : "--"}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!u?.blocked}
                          onChange={async (e) => {
                            const next = e.target.checked;
                            const prev = !!u?.blocked;

                            // optimistic UI update
                            setUsers((list) =>
                              list.map((x) => (x._id === u._id ? { ...x, blocked: next } : x))
                            );

                            try {
                              const reason = next ? prompt("Reason (optional):", u?.blockedReason || "") : "";
                              await axios.patch(BLOCK_TOGGLE_ENDPOINT(u._id), {
                                blocked: next,
                                reason
                              });
                              toast.success(next ? "User blocked" : "User unblocked");
                            } catch (err) {
                              // revert on failure
                              setUsers((list) =>
                                list.map((x) => (x._id === u._id ? { ...x, blocked: prev } : x))
                              );
                              const status = err?.response?.status;
                              const msg = err?.response?.data?.message || err?.message || "Failed";
                              toast.error(`${status ? `(${status}) ` : ""}${msg}`);
                            }
                          }}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className={`text-xs ${u?.blocked ? "text-red-400" : "text-green-400"}`}>
                          {u?.blocked ? "Blocked" : "Active"}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm opacity-70" colSpan={5}>
                    No matching users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
