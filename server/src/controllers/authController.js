import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/userModel.js";
import PendingUser from "../models/PendingUser.js";
import PasswordReset from "../models/PasswordReset.js";

const norm = (s = "") => s.trim().toLowerCase();

const JWT_SIGN = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("JWT_SECRET_MISSING");
    err.code = "JWT_SECRET_MISSING";
    throw err;
  }
  // token expiry add kar do
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  try {
    let { name, email, phone, password, role } = req.body;

    // public signup: role is always 'user'
    role = "user";

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const nEmail = norm(email);

    // email OR phone duplicate check (race-safe)
    const duplicate = await User.findOne({ $or: [{ email: nEmail }, { phone }] }).lean();
    if (duplicate) {
      const which = duplicate.email === nEmail ? "Email" : "Phone";
      return res.status(409).json({ success: false, message: `${which} already in use` });
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
        role, // forced 'user'
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 🛡️ email send guarded — SMTP fail hua to 202 (no 500)
    try {
      await sendEmail(
        nEmail,
        "Verify Your Email",
        `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
      );
      return res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (mailErr) {
      console.error("REGISTER_EMAIL_ERROR:", mailErr?.code || mailErr?.message || mailErr);
      return res.status(202).json({
        success: true,
        message: "Pending created, but email failed. Please use 'Resend OTP' later.",
      });
    }
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }
    // handle rare duplicate races
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const nEmail = norm(email);
    const otpStr = String(otp);

    const pending = await PendingUser.findOne({ email: nEmail });
    if (!pending) {
      return res.status(400).json({ success: false, message: "No OTP request found for this email" });
    }

    if (Date.now() > pending.expiresAt.getTime()) {
      await PendingUser.deleteOne({ email: nEmail });
      return res.status(400).json({ success: false, message: "OTP expired. Please register again." });
    }

    if (pending.otp !== otpStr) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // email or phone might have gotten used in parallel → handle E11000
    try {
      const newUser = await User.create({
        name: pending.name,
        email: nEmail,
        phone: pending.phone,
        password: pending.password, // already hashed
        role: "user",
        isVerified: true,
      });

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
    } catch (e) {
      if (e?.code === 11000) {
        const field = Object.keys(e.keyPattern || {})[0] || "field";
        return res.status(409).json({ success: false, message: `${field} already exists` });
      }
      throw e;
    }
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }
    console.error("OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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

    try {
      await sendEmail(
        nEmail,
        "Verify Your Email",
        `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
      );
      return res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (mailErr) {
      console.error("RESEND_EMAIL_ERROR:", mailErr?.code || mailErr?.message || mailErr);
      return res.status(202).json({
        success: true,
        message: "OTP updated but email failed. Try again later.",
      });
    }
  } catch (e) {
    console.error("Resend OTP error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const nEmail = norm(email);

    const user = await User.findOne({ email: nEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // optional but recommended: block check
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        blocked: true,
        message: "Your account is blocked. Contact support.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = JWT_SIGN(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error?.code === "JWT_SECRET_MISSING") {
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const nEmail = norm(email);

    const user = await User.findOne({ email: nEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await PasswordReset.findOneAndUpdate(
      { email: nEmail },
      { email: nEmail, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true }
    );

    try {
      await sendEmail(
        nEmail,
        "Reset Password OTP",
        `<h2>Your OTP to reset password is: ${otp}</h2><p>It will expire in 10 minutes.</p>`
      );
      return res.status(200).json({ success: true, message: "OTP sent to your email for password reset" });
    } catch (mailErr) {
      console.error("FORGOT_EMAIL_ERROR:", mailErr?.code || mailErr?.message || mailErr);
      return res.status(202).json({
        success: true,
        message: "OTP generated but email failed. Try again later.",
      });
    }
  } catch (e) {
    console.error("Forgot password error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const nEmail = norm(email);
    const otpStr = String(otp);

    const ticket = await PasswordReset.findOne({ email: nEmail });
    if (!ticket) {
      return res.status(400).json({ success: false, message: "No reset request found. Please try again." });
    }

    if (Date.now() > ticket.expiresAt.getTime()) {
      await PasswordReset.deleteOne({ email: nEmail });
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (ticket.otp !== otpStr) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please check and try again." });
    }

    return res.status(200).json({ success: true, message: "OTP verified. You can now reset your password." });
  } catch (e) {
    console.error("Verify reset OTP error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const nEmail = norm(email);

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const ticket = await PasswordReset.findOne({ email: nEmail });
    if (!ticket) {
      return res.status(400).json({ success: false, message: "Unauthorized request. OTP verification required." });
    }

    const user = await User.findOne({ email: nEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    await PasswordReset.deleteOne({ email: nEmail });

    return res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (e) {
    console.error("Reset password error:", e);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
