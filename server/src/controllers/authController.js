import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/userModel.js";

const pendingUsers = new Map();
const passwordResetRequests = new Map();

// export const register = async (req, res) => {
//   try {
//     const { name, email, phone, password, role } = req.body;

//     // 1. Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email already in use" });
//     }

//     // 2. Validate input (basic)
//     if (!name || !email || !phone || !password || !role) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required" });
//     }

//     // 3. Hash password securely
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // 4. Generate 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     // 5. Create and save new user
//     const newUser = new User({
//       name,
//       phone,
//       email,
//       password: hashedPassword,
//       role,
//       isVerified: false,
//       verificationCode: otp,
//     });

//     await newUser.save();

//     await sendEmail(
//       email,
//       "Verify Your Email",
//       `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
//     );

//     // // 5. Generate JWT token
//     // const token = jwt.sign(
//     //   { id: newUser._id, role: newUser.role },
//     //   process.env.JWT_SECRET
//     // );

//     // // 6. Send response with user details and token
//     // res.status(201).json({
//     //   success: true,
//     //   message: `User registered successfully as ${name}`,
//     //   user: { name, email, phone, role },
//     //   token, // Send the token in response
//     // });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate input
    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Check if already in pending
    if (pendingUsers.has(email)) {
      return res.status(400).json({
        success: false,
        message: "OTP already sent to this email. Please verify.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in pending map
    pendingUsers.set(email, {
      name,
      phone,
      password: hashedPassword,
      role,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via email
    await sendEmail(
      email,
      "Verify Your Email",
      `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 10 minutes.</p>`
    );

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// export const verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }
//     if (user.isVerified) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User already verified" });
//     }
//     if (user.verificationCode !== otp) {
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     // Mark user is verified
//     user.isVerified = true;
//     user.verificationCode = null;
//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET
//     );
//     return res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//       user: {
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//       },
//       token,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check pending
    const pending = pendingUsers.get(email);
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found for this email",
      });
    }

    if (Date.now() > pending.expiresAt) {
      pendingUsers.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    // Compare OTP
    if (pending.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Save new user
    const newUser = new User({
      name: pending.name,
      email,
      phone: pending.phone,
      password: pending.password,
      role: pending.role,
      isVerified: true,
    });

    await newUser.save();
    pendingUsers.delete(email); // Clean up

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
      },
      token,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const pending = pendingUsers.get(email);

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
    email,
    "Resend OTP",
    `<h2>Your new OTP is: ${otp}</h2><p>It expires in 10 minutes.</p>`
  );
  res.status(200).json({ success: true, message: "OTP resent to your email." });
};

export const login = async (req, res) => {
  try {
    // Gets user data in request
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // If the email is unregistered
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // If the user is unverified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // Compare the password with hashed password stored in DB
    const isMatch = await bcrypt.compare(password, user.password);

    // If password is incorrect
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Optional: Set expiration time for the token
    );

    // Send response with user details and token
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token, // Send the token in response
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
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found with this email",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  passwordResetRequests.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
  });

  await sendEmail(
    email,
    "Reset Password OTP",
    `<h2>Your OTP to reset password is: ${otp}</h2><p>It will expire in 10 minutes.</p>`
  );

  res.status(200).json({
    success: true,
    message: "OTP sent to your email for password reset",
  });
};

export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  const request = passwordResetRequests.get(email);
  if (!request) {
    return res.status(400).json({
      success: false,
      message: "No reset request found. Please try again.",
    });
  }

  if (Date.now() > request.expiresAt) {
    passwordResetRequests.delete(email);
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new one.",
    });
  }

  if (request.otp !== otp) {
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
  const { email, newPassword } = req.body;

  const request = passwordResetRequests.get(email);
  if (!request) {
    return res.status(400).json({
      success: false,
      message: "Unauthorized request. OTP verification required.",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  passwordResetRequests.delete(email);

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in.",
  });
};
