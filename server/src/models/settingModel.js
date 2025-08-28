import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    masterWalletAddress: {
      type: String,
      required: true,
      default: process.env.MASTER_WALLET_ADDRESS || "",
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export default Setting;
