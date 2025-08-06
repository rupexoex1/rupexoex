import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: true,
    },
    holderName: {
      type: String,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BankAccount", bankAccountSchema);
