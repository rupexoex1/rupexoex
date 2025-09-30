// src/pages/admin/BalanceAdjust.jsx
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const USERS_URL = "/api/v1/users/admin/users";
const BAL_URL = (id) => `/api/v1/users/admin/balance/${id}`;
const ADJUST_URL = (id) => `/api/v1/users/admin/users/${id}/adjust-balance`;

export default function BalanceAdjust() {
  const { axios } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balLoading, setBalLoading] = useState(false);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("credit"); // 'credit' | 'deduct'
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Load users (latest first)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(USERS_URL);
        if (!mounted) return;
        if (res?.data?.success && Array.isArray(res.data.users)) {
          const list = [...res.data.users].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
          setUsers(list);
        } else {
          toast.error(res?.data?.message || "Failed to load users");
        }
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load users");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [axios]);

  // Fetch available balance when user changes
  useEffect(() => {
    if (!selected?._id) {
      setBalance(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setBalLoading(true);
        const res = await axios.get(BAL_URL(selected._id));
        if (!mounted) return;
        setBalance(
          typeof res?.data?.balance === "number" ? res.data.balance : null
        );
      } catch {
        setBalance(null);
      } finally {
        if (mounted) setBalLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [axios, selected?._id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    const match = (v) => String(v ?? "").toLowerCase().includes(s);
    return users.filter((u) => match(u.name) || match(u.email) || match(u.phone));
  }, [q, users]);

  const fmt = (n) =>
    n === null || n === undefined || n === ""
      ? "—"
      : new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(n));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selected?._id) return toast.error("Select a user first");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return toast.error("Amount must be a positive number");
    }
    if (!["credit", "deduct"].includes(type)) {
      return toast.error("Invalid type");
    }

    // Safety guard for deduct
    if (type === "deduct" && typeof balance === "number" && amt > balance) {
      const ok = window.confirm(
        `This will deduct more than the user's available balance (${fmt(balance)}).\nAre you sure?`
      );
      if (!ok) return;
    }

    try {
      setSaving(true);
      const res = await axios.post(ADJUST_URL(selected._id), {
        amount: amt,
        type,
        reason,
      });
      if (res?.data?.success) {
        toast.success(`Balance ${type}ed successfully`);
        setAmount("");
        setReason("");

        // refresh balance after change
        try {
          const br = await axios.get(BAL_URL(selected._id));
          setBalance(
            typeof br?.data?.balance === "number" ? br.data.balance : balance
          );
        } catch {
          // ignore
        }
      } else {
        toast.error(res?.data?.message || "Adjustment failed");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-6">
      <Toaster />
      <h1 className="text-2xl font-semibold mb-1">Balance Adjust</h1>
      <p className="text-sm text-gray-400 mb-6">
        Credit/Deduct user balance (manual mode flow).
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users */}
        <div className="rounded-2xl bg-[#1e293b] border border-[#334155]">
          <div className="p-4 border-b border-[#334155]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name / email / phone"
              className="w-full rounded-md bg-[#0f172a] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-[420px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm opacity-70">Loading users…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm opacity-70">No users found</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[#0f172a]">
                  <tr className="text-left">
                    <th className="px-4 py-2">Select</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filtered.map((u) => (
                    <tr
                      key={u._id}
                      className={`hover:bg-[#0f172a] ${
                        selected?._id === u._id ? "bg-[#0b1220]" : ""
                      }`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="radio"
                          name="selectedUser"
                          checked={selected?._id === u._id}
                          onChange={() => setSelected(u)}
                          className="h-4 w-4 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-2">{u.name || "—"}</td>
                      <td className="px-4 py-2 break-all">{u.email || "—"}</td>
                      <td className="px-4 py-2">{u.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-[#1e293b] border border-[#334155] p-5">
          <div className="mb-4">
            <div className="text-sm text-gray-400">Selected user</div>
            <div className="mt-1 text-base font-medium">
              {selected ? `${selected.name || "—"} — ${selected.email || "—"}` : "—"}
            </div>
            <div className="mt-1 text-sm text-gray-300">
              Available Balance:&nbsp;
              {balLoading ? "…" : <b>USDT {fmt(balance)}</b>}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400">
                Type
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="credit"
                    checked={type === "credit"}
                    onChange={() => setType("credit")}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span>Credit</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="deduct"
                    checked={type === "deduct"}
                    onChange={() => setType("deduct")}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span>Deduct</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400">
                Amount (USDT)
              </label>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-md bg-[#0f172a] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Deposit confirmed (TX abc...), promo, correction, etc."
                className="w-full rounded-md bg-[#0f172a] border border-[#334155] text-sm px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!selected || saving}
              className={`px-4 py-2 rounded text-white text-sm ${
                !selected || saving
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Applying..." : `Apply ${type}`}
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-400">
            Note: Manual mode me available balance = credits − deductions.
          </div>
        </div>
      </div>
    </div>
  );
}
