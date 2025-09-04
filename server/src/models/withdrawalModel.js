// models/withdrawalModel.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    address: { type: String, required: true, trim: true },
    network: { type: String, default: "TRC20" },
    amount: { type: Number, required: true, min: 0.000001 },
    feeUSD: { type: Number, default: 6 }, // keep in sync with UI default
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
