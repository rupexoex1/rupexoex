import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  from: String,
  to: String,
  amount: Number,
  txHash: String,
  forwardedTxId: String,
  status: {
    type: String,
    enum: ["pending", "forwarded", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
