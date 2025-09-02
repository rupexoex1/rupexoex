// models/settingModel.js
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true }, // e.g. "RATES"
    data: {
      basic: { type: String, default: "91.50" }, // string rakhe to precision issues avoid hon
      vip: { type: String, default: "94.00" },
    },
  },
  { timestamps: true }
);

// single doc access helper
settingSchema.statics.getRates = async function () {
  let doc = await this.findOne({ key: "RATES" });
  if (!doc) doc = await this.create({ key: "RATES" });
  return doc;
};

export default mongoose.model("Setting", settingSchema);
