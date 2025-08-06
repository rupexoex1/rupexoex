import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  inrAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  },
  bankAccount: {
    accountNumber: String,
    ifsc: String,
    accountHolder: String,
  },
  plan: String,
  price: Number,
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
