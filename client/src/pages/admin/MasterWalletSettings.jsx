import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const tronAddrRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

const MasterWalletSettings = () => {
  const { axios } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [depositMode, setDepositMode] = useState("manual");
  const [address, setAddress] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/v1/users/admin/settings");
        if (!mounted) return;
        setAddress(res?.data?.masterWalletAddress || "");
        setDepositMode((res?.data?.depositMode || "manual").toLowerCase());
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to fetch settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [axios]);

  const onSave = async () => {
    const addr = address.trim();
    if (!addr) {
      toast.error("Address required");
      return;
    }
    if (!tronAddrRegex.test(addr)) {
      toast.error("Invalid TRON address (must start with T, 34 chars)");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put("/api/v1/users/admin/settings", {
        masterWalletAddress: addr,
      });
      toast.success("Master wallet updated");
      setAddress(res?.data?.masterWalletAddress || addr);
      setDirty(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-sm opacity-70">Loading settings…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Master Wallet Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Deposit mode: <b className="uppercase">{depositMode}</b>
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-3">
          <label className="text-xs tracking-wide uppercase text-gray-500">
            TRON (TRC20) Master Wallet Address
          </label>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setDirty(true);
            }}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="TXXXXXXXXXXXX..."
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || "");
                toast.success("Address copied");
              }}
              className="px-3 py-2 rounded bg-gray-900 text-white text-sm"
              type="button"
            >
              Copy
            </button>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className={`px-4 py-2 rounded text-sm text-white ${
                saving || !dirty ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              type="button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Tip: Use only for <b>USDT-TRC20.</b> After changing the address, the QR/address on the Deposit page will be updated instantly.
          </div>
        </div>

        {/* Live QR Preview */}
        <div className="flex flex-col items-center gap-3 bg-white rounded-2xl p-4 border">
          <div className="text-sm font-medium">QR Preview</div>
          <div className="bg-white p-3 rounded-xl border">
            <QRCode value={address || ""} size={180} />
          </div>
          <div className="text-xs break-words max-w-xs text-center text-gray-700">
            {address || "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterWalletSettings;
