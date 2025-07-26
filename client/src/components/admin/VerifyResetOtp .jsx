import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const VerifyResetOtp = () => {
  const { axios, navigate } = useAppContext();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showResend, setShowResend] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/verify-reset-otp", {
        email,
        otp,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate(`/reset-password?email=${email}`);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await axios.post("/api/v1/auth/forget-password", { email });
      if (res.data.success) {
        toast.success("OTP resent successfully");
        setTimeLeft(60);
        setShowResend(false);
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    }
  };

  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      setShowResend(true);
    }

    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleVerify}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Verify OTP</h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          OTP sent to <strong>{email}</strong>
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-2 border rounded mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
        />

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          disabled={loading}
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
  );
};

export default VerifyResetOtp;