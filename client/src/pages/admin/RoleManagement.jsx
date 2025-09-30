// src/pages/admin/RoleManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast, { Toaster } from "react-hot-toast";

const ROLES = ["admin", "manager", "user"];

export default function RoleManagement() {
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
    const t = setTimeout(() => setQ(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const [roleChanges, setRoleChanges] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 1 : page;

      const res = await axios.get("/api/v1/users/admin/users", {
        params: { page: p, limit, q },
      });
      const payload = res?.data || {};
      const list = payload.items || payload.users || [];

      // latest first
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // build nextRows BEFORE setting state, so we can compute totals without "prev"
      const nextRows = reset ? list : [...rows, ...list];
      setRows(nextRows);

      const supportsPaging =
        typeof payload.total === "number" || typeof payload.hasMore === "boolean";

      if (supportsPaging) {
        setTotal(payload.total ?? nextRows.length);
        setHasMore(Boolean(payload.hasMore));
      } else {
        setTotal(nextRows.length);
        setHasMore(list.length === limit); // heuristic when backend isn't paginated
      }

      setPage(p + 1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // first load + on search change → reset
  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    setRoleChanges({});
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges((p) => ({ ...p, [userId]: newRole }));
  };

  const saveRoleChange = async (userId) => {
    const newRole = roleChanges[userId];
    const user = rows.find((u) => u._id === userId);
    if (!user || !newRole || !ROLES.includes(newRole)) return;

    if (!window.confirm(`Change role of ${user?.name || user?.email} to ${newRole}?`)) return;

    try {
      setSavingId(userId);
      await axios.patch(`/api/v1/users/admin/users/${userId}/role`, { role: newRole });
      // optimistic
      setRows((L) => L.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      setRoleChanges((p) => {
        const c = { ...p };
        delete c[userId];
        return c;
      });
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!q) return rows;
    const match = (v) => String(v ?? "").toLowerCase().includes(q);
    return rows.filter(
      (u) => match(u?.name) || match(u?.email) || match(String(u?.phone || ""))
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <Toaster />
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">🔐 Role Management</h1>

        <div className="flex-1 min-w-[240px] max-w-md relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or phone…"
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

        <button
          onClick={() => load(true)}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs opacity-70 mb-2">
        Showing {filtered.length} of {total || rows.length}
      </div>

      {loading && rows.length === 0 ? (
        <div className="text-center">Loading users…</div>
      ) : (
        <div className="overflow-x-auto bg-[#1e293b] rounded-lg shadow-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#334155] text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filtered.map((user) => {
                const currentRole = user.role ?? "user";
                const selectedRole = roleChanges[user._id] ?? currentRole;
                const changed = selectedRole !== currentRole;

                return (
                  <tr key={user._id} className="align-top">
                    <td className="px-4 py-3">{user.name || "—"}</td>
                    <td className="px-4 py-3 break-all">{user.email || "—"}</td>
                    <td className="px-4 py-3">{user.phone ? String(user.phone) : "—"}</td>
                    <td className="px-4 py-3">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={selectedRole}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="p-1 border border-[#334155] rounded bg-[#0f172a]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r[0].toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => saveRoleChange(user._id)}
                        disabled={!changed || savingId === user._id}
                        className={`px-3 py-1 rounded text-sm ${
                          !changed || savingId === user._id
                            ? "bg-gray-500/40 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {savingId === user._id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm opacity-70" colSpan={6}>
                    No matching users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-center">
        {hasMore ? (
          <button
            disabled={loading}
            onClick={() => load(false)}
            className="px-4 py-2 bg-gray-700 rounded text-sm disabled:opacity-50"
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
