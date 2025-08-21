import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const normalizeEmail = (e = "") => e.trim().toLowerCase();

const ResendOtp = ({ email }) => {
  const { axios } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    const normEmail = normalizeEmail(email);
    if (!normEmail) return toast.error("Missing email for OTP resend");

    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/auth/resend-otp', { email: normEmail });
      toast.success(res.data.message || "OTP resent successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      className="text-sm text-blue-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Resending..." : "Resend OTP"}
    </button>
  );
};

export default ResendOtp;
