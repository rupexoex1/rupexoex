import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const normalizeEmail = (e = "") => e.trim().toLowerCase();

const ForgotPassword = () => {
  const { axios, navigate } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (loading) return;

    const normEmail = normalizeEmail(email);
    if (!normEmail) return toast.error("Please enter your email");

    setLoading(true);
    try {
      // ✅ backend route should be /forgot-password (not /forget-password)
      const res = await axios.post("/api/v1/auth/forgot-password", { email: normEmail });

      if (res.data.success) {
        toast.success(res.data.message || "OTP sent to your email");
        // ✅ pass normalized email forward
        navigate(`/verify-reset-otp?email=${encodeURIComponent(normEmail)}`);
      } else {
        toast.error(res.data.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <form
        onSubmit={handleSendOtp}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-[#6d4fc2] text-white rounded hover:bg-indigo-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
