import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "manager", "user"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;