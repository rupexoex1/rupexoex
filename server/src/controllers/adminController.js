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

    // ✅ Lock: Only allow one status update (from pending)
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order has already been marked as '${order.status}' and cannot be updated again`,
      });
    }

    if (status !== "confirmed" && status !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Only 'confirmed' or 'failed' are allowed",
      });
    }

    const alreadyDeducted = await BalanceAdjustment.findOne({
      orderId: order._id,
      type: "deduct",
    });

    // ✅ Confirming the order
    if (status === "confirmed") {
      if (!alreadyDeducted) {
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
        const totalDeducted = adjustments.reduce(
          (sum, adj) => sum + adj.amount,
          0
        );
        const availableBalance = totalForwarded - totalDeducted;

        // ❌ Block if balance is insufficient (prevents going below 0)
        if (order.amount > availableBalance) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance to confirm this order",
          });
        }

        // ✅ Deduct only once
        await new BalanceAdjustment({
          userId: order.user,
          amount: order.amount,
          type: "deduct",
          reason: "Admin confirmed order",
          orderId: order._id,
        }).save();
      }
    }

    // ✅ If failed — no deduction, no refund
    // (Only one update allowed, so refund scenario doesn’t apply)

    // ✅ Mark status + timestamp
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
