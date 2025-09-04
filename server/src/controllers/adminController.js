import mongoose from "mongoose";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import BalanceAdjustment from "../models/balanceAdjustmentModel.js";
import Withdrawal from "../models/withdrawalModel.js";

const isManual =
  (process.env.DEPOSIT_MODE || "manual").toLowerCase() === "manual";

/**
 * GET /admin/transactions
 */
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "email")
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

/**
 * GET /admin/dashboard-stats
 */
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

    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

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

/**
 * PUT /admin/orders/:id
 * Only allow: pending -> confirmed/failed (one-time)
 * On confirmed: deduct once (manual: credits-deduct; auto: forwarded-deduct)
 */
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

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Order has already been marked as '${order.status}' and cannot be updated again`,
      });
    }

    if (!["confirmed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Only 'confirmed' or 'failed' are allowed",
      });
    }

    const alreadyDeducted = await BalanceAdjustment.findOne({
      orderId: order._id,
      type: "deduct",
    });

    // compute available
    let availableBalance = 0;
    if (isManual) {
      const adjustments = await BalanceAdjustment.find({ userId: order.user });
      const totalCredits = adjustments
        .filter((a) => a.type === "credit")
        .reduce((s, a) => s + a.amount, 0);
      const totalDebits = adjustments
        .filter((a) => a.type === "deduct")
        .reduce((s, a) => s + a.amount, 0);
      availableBalance = totalCredits - totalDebits;
    } else {
      const [txs, debits] = await Promise.all([
        Transaction.find({ userId: order.user, status: "forwarded" }),
        BalanceAdjustment.find({ userId: order.user, type: "deduct" }),
      ]);
      const totalForwarded = txs.reduce((s, tx) => s + tx.amount, 0);
      const totalDebits = debits.reduce((s, d) => s + d.amount, 0);
      availableBalance = totalForwarded - totalDebits;
    }

    if (status === "confirmed") {
      if (order.amount > availableBalance) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance to confirm this order",
        });
      }

      if (!alreadyDeducted) {
        await new BalanceAdjustment({
          userId: order.user,
          amount: order.amount,
          type: "deduct",
          reason: "Admin confirmed order",
          orderId: order._id,
        }).save();
      }
    }

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

/**
 * GET /admin/orders
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* ========== Withdrawals (ADMIN) ========== */

// GET /api/v1/users/admin/withdrawals
export const adminListWithdrawals = async (_req, res) => {
  try {
    const rows = await Withdrawal.find({})
      .populate("user", "email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, withdrawals: rows });
  } catch (err) {
    console.error("adminListWithdrawals error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/v1/users/admin/withdrawals/:id
export const adminUpdateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "approved" | "rejected"

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid withdrawal ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const wd = await Withdrawal.findById(id);
    if (!wd) return res.status(404).json({ success: false, message: "Not found" });
    if (wd.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Already processed" });
    }

    // If REJECTED → refund the hold (amount + fee) via BalanceAdjustment credit.
    if (status === "rejected") {
      const refundAmount = Number(wd.amount || 0) + Number(wd.feeUSD || 0);

      // idempotency guard: don't double-refund the same withdrawal
      const alreadyRefunded = await BalanceAdjustment.findOne({
        userId: wd.user,
        type: "credit",
        reason: `withdrawal_refund:${wd._id}`,
      });

      if (!alreadyRefunded) {
        await new BalanceAdjustment({
          userId: wd.user,
          amount: refundAmount,
          type: "credit",
          reason: `withdrawal_refund:${wd._id}`,
          createdBy: req.user?._id,
        }).save();
      }
    }

    // If APPROVED → do nothing to balance; funds already held on create
    wd.status = status;
    wd.completedAt = new Date();
    await wd.save();

    return res.json({ success: true, withdrawal: wd });
  } catch (err) {
    console.error("adminUpdateWithdrawalStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
