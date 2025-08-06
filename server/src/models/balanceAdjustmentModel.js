import mongoose from "mongoose";

const balanceAdjustmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "Order confirmed",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const BalanceAdjustment = mongoose.model("BalanceAdjustment", balanceAdjustmentSchema);

export default BalanceAdjustment;
