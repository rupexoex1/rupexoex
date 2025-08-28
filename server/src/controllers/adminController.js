import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import BalanceAdjustment from "../models/balanceAdjustmentModel.js";
import mongoose from "mongoose";

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "email") // show user email
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

    // Users Registered Today
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    // Users Registered Last Month
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,
        $lte: endOfLastMonth,
      },
    });

    // percentage change (simple)
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
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order ID" });
    }

    if (!["pending", "confirmed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: pending | confirmed | failed",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Lock: Only allow one status update (from pending)
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order has already been marked as '${order.status}' and cannot be updated again`,
      });
    }

    if (status === "confirmed") {
      // Check balance before deduction
      const transactions = await Transaction.find({
        userId: order.user,
        status: "forwarded",
      });

      const adjustments = await BalanceAdjustment.find({
        userId: order.user,
      });

      const totalForwarded = transactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );
      const totalDebits = adjustments
        .filter((a) => a.type === "deduct")
        .reduce((s, a) => s + a.amount, 0);

      const availableBalance = totalForwarded - totalDebits;

      if (order.amount > availableBalance) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance to confirm this order",
        });
      }

      // Deduct only once
      const alreadyDeducted = await BalanceAdjustment.findOne({
        orderId: order._id,
        type: "deduct",
      });
      if (!alreadyDeducted) {
        await BalanceAdjustment.create({
          userId: order.user,
          amount: order.amount,
          type: "deduct",
          reason: "Admin confirmed order",
          orderId: order._id,
          createdBy: req.user._id,
        });
      }
    }

    // finalize
    order.status = status;
    order.completedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order marked as '${status}' successfully`,
      order,
    });
  } catch (err) {
    console.error("Order status update error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error updating order status" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    // bankAccount is embedded object in your UI usage; no populate needed
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders" });
  }
};