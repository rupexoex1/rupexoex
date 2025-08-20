import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TronWeb } from "tronweb";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/userModel.js";

const pendingUsers = new Map();
const passwordResetRequests = new Map();

// ---- Helper (NEW) ----
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate input
    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // 🔧 CHANGE: normalize email
    const emailNorm = normalizeEmail(email);

    // Check if email already registered
    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Check if already in pending
    if (pendingUsers.has(emailNorm)) {
      return res.status(400).json({
        success: false,
        message: "OTP already sent to this email. Please verify.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔧 CHANGE: store by normalized email
    pendingUsers.set(emailNorm, {
      name,
      phone,
      password: hashedPassword,
      role,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via email (use the raw email or emailNorm—both will deliver)
    await sendEmail(
      emailNorm,
      "Verify Your Email",
      `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
    );

    // (Optional) debug
    console.log("register -> pendingUsers keys:", [...pendingUsers.keys()]);

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // 🔧 CHANGE: normalize + coerce OTP to string
    const emailNorm = normalizeEmail(email);
    otp = String(otp || "").trim();

    // 🔧 CHANGE: get by normalized email
    const pending = pendingUsers.get(emailNorm);

    // (Optional) debug
    console.log("verifyOtp body:", { email: emailNorm, otp });
    console.log("verifyOtp -> pendingUsers keys:", [...pendingUsers.keys()]);

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found for this email",
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingUsers.delete(emailNorm);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    // 🔧 CHANGE: compare as strings
    if (String(pending.otp) !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Generate TRON wallet
    const tronWeb = new TronWeb({ fullHost: process.env.TRON_FULL_HOST });
    const wallet = await tronWeb.createAccount();

    // Create user with wallet
    const newUser = new User({
      name: pending.name,
      email: emailNorm, // 🔧 store normalized
      phone: pending.phone,
      password: pending.password,
      role: pending.role,
      isVerified: true,
      tronWallet: {
        address: wallet.address.base58,
        privateKey: wallet.privateKey, // encrypt in prod
      },
    });

    await newUser.save();
    pendingUsers.delete(emailNorm); // Clean up

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      success: true,
      message: "OTP verified. Account created successfully.",
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        tronWallet: newUser.tronWallet,
      },
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  // 🔧 CHANGE: normalize email
  const emailNorm = normalizeEmail(req.body.email);
  const pending = pendingUsers.get(emailNorm);

  if (!pending) {
    return res.status(404).json({
      success: false,
      message: "No registration found. Please register again.",
    });
    }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pending.otp = otp;
  pending.expiresAt = Date.now() + 10 * 60 * 1000;

  await sendEmail(
    emailNorm,
    "Resend OTP",
    `<h2>Your new OTP is: ${otp}</h2><p>It expires in 10 minutes.</p>`
  );
  res.status(200).json({ success: true, message: "OTP resent to your email." });
};

export const login = async (req, res) => {
  try {
    const { password } = req.body;
    const emailNorm = normalizeEmail(req.body.email); // 🔧

    // Find user by normalized email
    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tronWallet: user.tronWallet,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  // 🔧 CHANGE: normalize email
  const emailNorm = normalizeEmail(req.body.email);

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found with this email",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 🔧 CHANGE: use normalized key
  passwordResetRequests.set(emailNorm, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  await sendEmail(
    emailNorm,
    "Reset Password OTP",
    `<h2>Your OTP to reset password is: ${otp}</h2><p>It will expire in 10 minutes.</p>`
  );

  res.status(200).json({
    success: true,
    message: "OTP sent to your email for password reset",
  });
};

export const verifyResetOtp = async (req, res) => {
  // 🔧 CHANGE: normalize + coerce
  const emailNorm = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();

  const request = passwordResetRequests.get(emailNorm);
  if (!request) {
    return res.status(400).json({
      success: false,
      message: "No reset request found. Please try again.",
    });
  }

  if (Date.now() > request.expiresAt) {
    passwordResetRequests.delete(emailNorm);
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new one.",
    });
  }

  if (String(request.otp) !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please check and try again.",
    });
  }

  res.status(200).json({
    success: true,
    message: "OTP verified. You can now reset your password.",
  });
};

export const resetPassword = async (req, res) => {
  // 🔧 CHANGE: normalize
  const emailNorm = normalizeEmail(req.body.email);
  const { newPassword } = req.body;

  const request = passwordResetRequests.get(emailNorm);
  if (!request) {
    return res.status(400).json({
      success: false,
      message: "Unauthorized request. OTP verification required.",
    });
  }

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  passwordResetRequests.delete(emailNorm);

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in.",
  });
};
