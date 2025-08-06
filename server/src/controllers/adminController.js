import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import BalanceAdjustment from "../models/balanceAdjustmentModel.js";
import mongoose from "mongoose";

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

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Handle completion + optional deduction logic
    if (
      (status === "confirmed" || status === "failed") &&
      order.status === "pending"
    ) {
      if (status === "confirmed") {
        const userId = order.user;

        const transactions = await Transaction.find({
          userId,
          status: "forwarded",
        });

        const virtualBalance = transactions.reduce(
          (sum, tx) => sum + tx.amount,
          0
        );

        if (order.amount > virtualBalance) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance to confirm this order",
          });
        }

        await new BalanceAdjustment({
          userId,
          amount: order.amount,
          type: "deduct",
          orderId: order._id,
        }).save();
      }

      order.completedAt = new Date(); // ✅ This will work for both confirmed & failed
    }

    // ✅ Save new status
    order.status = status;
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Order updated", order });
  } catch (err) {
    console.error("Order status update error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("bankAccount"); // If you're using ref in bankAccount

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};
