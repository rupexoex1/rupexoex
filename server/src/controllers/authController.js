import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/userModel.js";
import PendingUser from "../models/PendingUser.js";
import PasswordReset from "../models/PasswordReset.js";

const norm = (s = "") => s.trim().toLowerCase();

const JWT_SIGN = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const nEmail = norm(email);

    const existingUser = await User.findOne({ email: nEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert pending registration (TTL via expiresAt)
    await PendingUser.findOneAndUpdate(
      { email: nEmail },
      {
        name,
        email: nEmail,
        phone,
        password: hashedPassword,
        role,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendEmail(
      nEmail,
      "Verify Your Email",
      `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
    );

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const nEmail = norm(email);
    const otpStr = String(otp);

    const pending = await PendingUser.findOne({ email: nEmail });
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found for this email",
      });
    }

    if (Date.now() > pending.expiresAt.getTime()) {
      await PendingUser.deleteOne({ email: nEmail });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    if (pending.otp !== otpStr) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP" });
    }

    // Create verified user
    const newUser = new User({
      name: pending.name,
      email: nEmail,
      phone: pending.phone,
      password: pending.password, // already hashed
      role: pending.role,
      isVerified: true,
    });
    await newUser.save();

    await PendingUser.deleteOne({ email: nEmail });

    const token = JWT_SIGN(newUser);

    return res.status(201).json({
      success: true,
      message: "OTP verified. Account created successfully.",
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const nEmail = norm(email);

    const pending = await PendingUser.findOne({ email: nEmail });
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "No registration found. Please register again.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = otp;
    pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pending.save();

    await sendEmail(
      nEmail,
      "Resend OTP",
      `<h2>Your new OTP is: ${otp}</h2><p>It expires in 10 minutes.</p>`
    );

    return res
      .status(200)
      .json({ success: true, message: "OTP resent to your email." });
  } catch (e) {
    console.error("Resend OTP error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


// yahan se change kia

export const login = async (req, res) => {
  try {
    // 0) Basic input check (so server never crashes on empty fields)
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email & password required" });
    }

    const nEmail = (email || "").trim().toLowerCase();

    // 1) Get the user AND the hidden password field
    const user = await User.findOne({ email: nEmail }).select("+password"); // <-- important
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // 2) Block login if not verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in."
      });
    }

    // 3) Compare password safely
    if (!user.password) {
      console.error("Login error: password not selected for", nEmail);
      return res.status(500).json({ success: false, message: "Server misconfigured" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 4) JWT secret guard (prevents crash if missing)
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ success: false, message: "Server misconfigured" });
    }

    // 5) Make the token and respond
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
  console.error('Login error:', err); // keep this
  return res.status(500).json({ success: false, message: String(err?.message || err) });
}

};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const nEmail = norm(email);

    const user = await User.findOne({ email: nEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await PasswordReset.findOneAndUpdate(
      { email: nEmail },
      { email: nEmail, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true }
    );

    await sendEmail(
      nEmail,
      "Reset Password OTP",
      `<h2>Your OTP to reset password is: ${otp}</h2><p>It will expire in 10 minutes.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email for password reset",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const nEmail = norm(email);
    const otpStr = String(otp);

    const ticket = await PasswordReset.findOne({ email: nEmail });
    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: "No reset request found. Please try again.",
      });
    }

    if (Date.now() > ticket.expiresAt.getTime()) {
      await PasswordReset.deleteOne({ email: nEmail });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (ticket.otp !== otpStr) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified. You can now reset your password.",
    });
  } catch (e) {
    console.error("Verify reset OTP error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const nEmail = norm(email);

    const ticket = await PasswordReset.findOne({ email: nEmail });
    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized request. OTP verification required.",
      });
    }

    const user = await User.findOne({ email: nEmail });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    await PasswordReset.deleteOne({ email: nEmail });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (e) {
    console.error("Reset password error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
