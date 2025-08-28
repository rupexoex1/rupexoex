import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const BalanceAdjust = () => {
  const { axios } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("credit"); // credit | deduct
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/v1/users/admin/users");
        if (!mounted) return;
        if (res?.data?.success) {
          setUsers(res.data.users || []);
        } else {
          toast.error("Failed to load users");
        }
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load users");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [axios]);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const x = q.trim().toLowerCase();
    return users.filter((u) =>
      [u.name, u.email, u.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(x))
    );
  }, [q, users]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      toast.error("Select a user first");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    if (!["credit", "deduct"].includes(type)) {
      toast.error("Invalid type");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        `/api/v1/users/admin/users/${selected._id}/adjust-balance`,
        { amount: amt, type, reason }
      );
      if (res?.data?.success) {
        toast.success(`Balance ${type}ed successfully`);
        setAmount("");
        setReason("");
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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">Balance Adjust</h1>
      <p className="text-sm text-gray-500 mb-6">
        Credit/Deduct user balance (manual mode flow).
      </p>

      {/* top: search + users list */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Users */}
        <div className="rounded-2xl border bg-white">
          <div className="p-4 border-b">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name / email / phone"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-[420px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm opacity-70">Loading users…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm opacity-70">No users found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left">
                    <th className="p-3">Select</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u._id}
                      className={`border-t hover:bg-gray-50 ${selected?._id === u._id ? "bg-blue-50" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="radio"
                          name="selectedUser"
                          checked={selected?._id === u._id}
                          onChange={() => setSelected(u)}
                        />
                      </td>
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-4">
            <div className="text-sm text-gray-600">Selected user</div>
            <div className="mt-1 text-base font-medium">
              {selected ? `${selected.name} — ${selected.email}` : "—"}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Type
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="credit"
                    checked={type === "credit"}
                    onChange={() => setType("credit")}
                  />
                  <span>Credit</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="deduct"
                    checked={type === "deduct"}
                    onChange={() => setType("deduct")}
                  />
                  <span>Deduct</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Amount (USDT)
              </label>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Deposit confirmed on TX abc..., promo, manual correction, etc."
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!selected || saving}
              className={`px-4 py-2 rounded text-white text-sm ${
                !selected || saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Applying..." : `Apply ${type}`}
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            Note: Manual mode me available balance = credits − deductions.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceAdjust;
