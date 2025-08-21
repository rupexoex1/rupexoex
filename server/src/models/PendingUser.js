import mongoose from "mongoose";

const PendingUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["admin", "manager", "user"], default: "user" },
    otp: { type: String, required: true },
    // TTL: document expires exactly at this date/time
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.PendingUser ||
  mongoose.model("PendingUser", PendingUserSchema);
