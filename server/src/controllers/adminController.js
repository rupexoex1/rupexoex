import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "email") // to show user email in frontend
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Admin transaction fetch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all transactions",
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // ✅ Users Registered Today
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    // ✅ Users Registered Last Month
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,
        $lte: endOfLastMonth,
      },
    });

    // ✅ Calculate percentage change
    const userGrowthPercent = lastMonthUsers
      ? (((todayNewUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(2)
      : 100;

    return res.status(200).json({
      success: true,
      todayNewUsers,
      userGrowthPercent: parseFloat(userGrowthPercent),
    });
  } catch (err) {
    console.error("Admin stats error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
