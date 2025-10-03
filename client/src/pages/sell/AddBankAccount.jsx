import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/; // standard IFSC format

export default function AddBankAccount() {
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const [form, setForm] = useState({
    accountNumber: "",
    ifsc: "",
    holderName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // keep IFSC uppercase as the user types
    if (name === "ifsc") {
      setForm((f) => ({ ...f, ifsc: value.toUpperCase() }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // normalize/trim
    const holderName = form.holderName.trim();
    const ifsc = form.ifsc.trim().toUpperCase();
    const accountNumber = form.accountNumber.replace(/[\s-]/g, "").trim(); // keep as string

    // validations
    if (!holderName || !ifsc || !accountNumber) {
      return toast.error("Please fill all fields");
    }
    if (!IFSC_REGEX.test(ifsc)) {
      return toast.error("Invalid IFSC format (e.g. HDFC0XXXXXX)");
    }
    if (accountNumber.length < 9 || accountNumber.length > 18) {
      return toast.error("Account number should be 9–18 digits");
    }
    if (!/^\d+$/.test(accountNumber)) {
      return toast.error("Account number must be digits only");
    }
    if (holderName.length < 3) {
      return toast.error("Payee name looks too short");
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/v1/users/accounts", {
        accountNumber,
        ifsc,
        holderName,
      });

      if (res?.data?.success) {
        toast.success("Account added successfully");
        navigate("/select-payee"); // go pick/select the payee
      } else {
        toast.error(res?.data?.message || "Failed to add account");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Error adding account";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-xl" aria-label="Go back">
          ←
        </button>
        <h1 className="text-lg font-bold">Add new Bank Account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-10 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Account Number</label>
          <input
            type="text" // keep as text to preserve leading zeros
            name="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            value={form.accountNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="Enter account number"
          />
          <p className="text-xs text-white/60 mt-1">
            Digits only. Spaces/dashes are okay — we’ll clean them.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">IFSC</label>
          <input
            type="text"
            name="ifsc"
            autoCapitalize="characters"
            value={form.ifsc}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="e.g. HDFC0XXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Payee Name</label>
          <input
            type="text"
            name="holderName"
            value={form.holderName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#1e293b] text-white rounded outline-none"
            placeholder="Enter name on account"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full py-3 text-white rounded font-semibold text-center ${
            loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
