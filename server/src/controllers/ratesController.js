// controllers/ratesController.js
import Setting from "../models/settingModel.js";

export const getPublicRates = async (req, res) => {
  try {
    
    const doc = await Setting.getRates();
    return res.json({
      success: true,
      basic: doc.data.basic,
      vip: doc.data.vip,
      basicMin: doc.data.basicMin,
      basicMax: doc.data.basicMax,
      vipMin: doc.data.vipMin,
    });
  } catch (e) {
    console.error("getPublicRates error:", e);
    return res.status(500).json({ success: false, message: "Failed to get rates" });
  }
};

// NOTE: Secure with admin middleware where you mount the route
export const updateRates = async (req, res) => {
  try {
    
    const { basic, vip, basicMin, basicMax, vipMin } = req.body;

    if (basic == null || vip == null) {
      return res.status(400).json({ success: false, message: "basic and vip are required" });
    }
    if (basicMin != null && isNaN(Number(basicMin))) {
      return res.status(400).json({ success: false, message: "basicMin must be a number" });
    }
    if (basicMax != null && isNaN(Number(basicMax))) {
      return res.status(400).json({ success: false, message: "basicMax must be a number" });
    }
    if (vipMin != null && isNaN(Number(vipMin))) {
      return res.status(400).json({ success: false, message: "vipMin must be a number" });
    }

    const doc = await Setting.getRates();
    doc.data.basic = String(basic);
    doc.data.vip = String(vip);

    if (basicMin != null) doc.data.basicMin = Number(basicMin);
    if (basicMax != null) doc.data.basicMax = Number(basicMax);
    if (vipMin   != null) doc.data.vipMin   = Number(vipMin);

    await doc.save();

    return res.json({
      success: true,
      message: "Rates updated",
      basic: doc.data.basic,
      vip: doc.data.vip,
      basicMin: doc.data.basicMin,
      basicMax: doc.data.basicMax,
      vipMin: doc.data.vipMin,
    });
  } catch (e) {
    console.error("updateRates error:", e);
    return res.status(500).json({ success: false, message: "Failed to update rates" });
  }
};
