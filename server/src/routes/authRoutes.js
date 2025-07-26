import express from "express";
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/authController.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/resend-otp", resendOtp);
authRoutes.post("/login", login);
authRoutes.post("/forget-password", forgotPassword);
authRoutes.post("/verify-reset-otp", verifyResetOtp);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes;
