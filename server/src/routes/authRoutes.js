import express from "express";
import {
  register,
  login,
  verifyOtp,
  resendOtp,
} from "../controllers/authController.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/verify-otp", verifyOtp);
authRoutes.post("/resend-otp", resendOtp);
authRoutes.post("/login", login);

export default authRoutes;
