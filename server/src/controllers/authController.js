import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // 2. Validate input (basic)
    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // 3. Hash password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create and save new user
    const newUser = new User({
      name,
      phone,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
    );

    // 6. Send response with user details and token
    res.status(201).json({
      success: true,
      message: `User registered successfully as ${name}`,
      user: { name, email, phone, role },
      token,  // Send the token in response
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    // Gets user data in request
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // If the email is unregistered
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Compare the password with hashed password stored in DB
    const isMatch = await bcrypt.compare(password, user.password);

    // If password is incorrect
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }  // Optional: Set expiration time for the token
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
      token,  // Send the token in response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
