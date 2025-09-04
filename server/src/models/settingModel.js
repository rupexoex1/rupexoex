// models/settingModel.js
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true }, // "RATES"
    data: {
      basic: { type: String, default: "91.50" },
      vip: { type: String, default: "94.00" },

      // ✅ add these
      basicMin: { type: Number, default: 100 },
      basicMax: { type: Number, default: 5000 },
      vipMin:   { type: Number, default: 5001 },
    },
    masterWalletAddress: { type: String, default: "" }, // (you already use this elsewhere)
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

settingSchema.statics.getRates = async function () {
  let doc = await this.findOne({ key: "RATES" });
  if (!doc) doc = await this.create({ key: "RATES" });
  return doc;
};

export default mongoose.model("Setting", settingSchema);
