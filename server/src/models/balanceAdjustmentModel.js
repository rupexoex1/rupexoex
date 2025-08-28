// src/models/balanceAdjustmentModel.js
import mongoose from "mongoose";

const balanceAdjustmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be >= 0"],
    },
    // direction of adjustment
    type: {
      type: String,
      enum: ["credit", "deduct"],
      required: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    // optional: only present when deduction is tied to an order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    // optional: which admin/manager created this adjustment
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// common query: latest adjustments for a user
balanceAdjustmentSchema.index({ userId: 1, createdAt: -1 });

const BalanceAdjustment =
  mongoose.models.BalanceAdjustment ||
  mongoose.model("BalanceAdjustment", balanceAdjustmentSchema);

export default BalanceAdjustment;