import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const normalizeEmail = (e = "") => e.trim().toLowerCase();

const ResetPassword = () => {
  const { axios, navigate } = useAppContext();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const email = normalizeEmail(emailParam);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email) return toast.error("Missing email, please restart the flow.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/reset-password", {
        email,
        newPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Password reset successful");
        navigate("/login");
      } else {
        toast.error(res.data.message || "Reset failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <form
        onSubmit={handleReset}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full p-2 border-b-2 border-gray-300 outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-2.5 text-sm text-gray-500 cursor-pointer"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full p-2 border-b-2 border-gray-300 outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-[#6d4fc2] text-white rounded hover:bg-[#5a3fb5] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
