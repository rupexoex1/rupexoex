import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const ResendOtp = ({ email }) => {
  const { axios } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email for OTP resend");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/v1/auth/resend-otp', { email });
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
      className="text-sm text-blue-600 hover:underline"
    >
      {loading ? "Resending..." : "Resend OTP"}
    </button>
  );
};

export default ResendOtp;
