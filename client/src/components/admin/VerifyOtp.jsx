import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const normalizeEmail = (e = "") => e.trim().toLowerCase();

const VerifyOtp = () => {
  const { axios, setToken, navigate } = useAppContext();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const email = normalizeEmail(emailParam);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showResend, setShowResend] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email) {
      toast.error("Missing email. Please register again.");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/verify-otp", {
        email,           // already normalized
        otp: String(otp) // ensure string
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setToken(res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

        toast.success(res.data.message || "Account verified successfully!");
        navigate("/");
      } else {
        toast.error(res.data.message || "OTP verification failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await axios.post("/api/v1/auth/resend-otp", { email });
      toast.success(res.data.message || "OTP resent successfully");
      setTimeLeft(60);
      setShowResend(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  useEffect(() => {
    if (!timeLeft) {
      setShowResend(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] px-8">
      <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Verify Email</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Enter the OTP sent to <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-6 w-full sm:max-w-md text-gray-600">
          <div className="flex flex-col">
            <label>Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              required
              placeholder="Enter 6-digit OTP"
              className="border-b-2 border-gray-300 p-2 outline-none mb-4"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mb-2 font-medium bg-[#6d4fc2] text-white rounded cursor-pointer hover:bg-primary/90 disabled:opacity-60"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          {showResend ? (
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Resend OTP in {timeLeft} second{timeLeft !== 1 ? "s" : ""}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
