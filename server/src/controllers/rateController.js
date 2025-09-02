// controllers/ratesController.js
import Setting from "../models/settingModel.js";

export const getPublicRates = async (req, res) => {
  try {
    const doc = await Setting.getRates();
    return res.json({
      basic: doc.data.basic,
      vip: doc.data.vip,
    });
  } catch (e) {
    console.error("getPublicRates error:", e);
    return res.status(500).json({ message: "Failed to get rates" });
  }
};

// NOTE: Secure this with your admin auth middleware
export const updateRates = async (req, res) => {
  try {
    const { basic, vip } = req.body;
    if (!basic || !vip) {
      return res.status(400).json({ success: false, message: "Both basic and vip are required" });
    }

    const doc = await Setting.getRates();
    doc.data.basic = String(basic);
    doc.data.vip = String(vip);
    await doc.save();

    return res.json({ success: true, message: "Rates updated", basic: doc.data.basic, vip: doc.data.vip });
  } catch (e) {
    console.error("updateRates error:", e);
    return res.status(500).json({ success: false, message: "Failed to update rates" });
  }
};
