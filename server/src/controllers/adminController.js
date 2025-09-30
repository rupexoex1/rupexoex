// server/src/controllers/adminController.js
import mongoose from "mongoose";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import BalanceAdjustment from "../models/balanceAdjustmentModel.js";
import Withdrawal from "../models/withdrawalModel.js";

// deposit mode switch (same as userController)
const isManual =
  (process.env.DEPOSIT_MODE || "manual").toLowerCase() === "manual";

/**
 * GET /admin/transactions
 */
export const getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const skip = (page - 1) * limit;

    const filter = {}; // optionally add status/user/q/date filters here

    const [rows, total] = await Promise.all([
      Transaction.find(filter, "-__v")
        .populate({ path: "userId", select: "email" })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
      transactions: rows,
    });
  } catch (error) {
    console.error("Admin transaction fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch all transactions" });
  }
};

/**
 * GET /admin/dashboard-stats
 */
export const getAdminStats = async (_req, res) => {
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
 * pending → confirmed | failed
 * confirm: NO extra deduct (hold already placed on order create)
 * failed: refund the hold once (idempotent)
 */
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID" });
  }
  if (!["confirmed", "failed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
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
        message: `Order is already '${order.status}'`,
      });
    }

    // hold that was created at placement time
    const existingHold = await BalanceAdjustment.findOne({
      orderId: order._id,
      type: "deduct",
      reason: { $regex: /^order_hold:/ },
    }).lean();

    if (status === "confirmed") {
      // just mark done; balance was held earlier
      order.status = "confirmed";
      order.completedAt = new Date();
      await order.save();
      return res.json({ success: true, message: "Order confirmed", order });
    }

    // status === 'failed' → refund the held amount once
    if (existingHold) {
      const alreadyRefunded = await BalanceAdjustment.findOne({
        orderId: order._id,
        type: "credit",
        reason: `order_refund:${order._id}`,
      }).lean();

      if (!alreadyRefunded) {
        await new BalanceAdjustment({
          userId: order.user,
          amount: existingHold.amount,
          type: "credit",
          reason: `order_refund:${order._id}`,
          orderId: order._id,
          createdBy: req.user?._id || null,
        }).save();
      }
    }

    order.status = "failed";
    order.completedAt = new Date();
    await order.save();

    return res.json({ success: true, message: "Order marked failed", order });
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
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const skip = (page - 1) * limit;

    const filter = {}; // add status/user filters if needed

    const [rows, total] = await Promise.all([
      Order.find(filter)
        // send minimal fields for list view (details page uses /orders/:id)
        .select("user amount inrAmount status plan price createdAt completedAt")
        .populate({ path: "user", select: "email" })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
      orders: rows,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* ========== Withdrawals (ADMIN) ========== */

/**
 * GET /api/v1/users/admin/withdrawals
 */
export const adminListWithdrawals = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Withdrawal.find({}, "-__v")
        .populate({ path: "user", select: "email" })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      hasMore: skip + rows.length < total,
      withdrawals: rows,
    });
  } catch (err) {
    console.error("adminListWithdrawals error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PUT /api/v1/users/admin/withdrawals/:id
 * approve: do nothing to balance (amount+fee already held on create)
 * reject: refund exactly the held amount once (idempotent)
 */
export const adminUpdateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const wd = await Withdrawal.findById(id);
    if (!wd)
      return res.status(404).json({ success: false, message: "Not found" });
    if (wd.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Already processed" });
    }

    if (status === "rejected") {
      // locate the hold we created at request time
      const holdAdj = await BalanceAdjustment.findOne({
        userId: wd.user,
        type: "deduct",
        reason: `withdrawal_hold:${wd._id}`,
      }).lean();

      const alreadyRefunded = await BalanceAdjustment.findOne({
        userId: wd.user,
        type: "credit",
        reason: `withdrawal_refund:${wd._id}`,
      }).lean();

      if (!alreadyRefunded) {
        const refundAmount =
          holdAdj?.amount ?? Number(wd.amount || 0) + Number(wd.feeUSD || 7);
        await new BalanceAdjustment({
          userId: wd.user,
          amount: refundAmount,
          type: "credit",
          reason: `withdrawal_refund:${wd._id}`,
          orderId: null,
          createdBy: req.user?._id || null,
        }).save();
      }
    }

    // approve → no balance change (funds already held)
    wd.status = status;
    wd.completedAt = new Date();
    await wd.save();

    return res.json({ success: true, withdrawal: wd });
  } catch (err) {
    console.error("adminUpdateWithdrawalStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const computeAvailableBalance = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  if (isManual) {
    const adjustments = await BalanceAdjustment.find({ userId: uid }).lean();
    const totalCredits = adjustments
      .filter((a) => a.type === "credit")
      .reduce((s, a) => s + Number(a.amount || 0), 0);
    const totalDebits = adjustments
      .filter((a) => a.type === "deduct")
      .reduce((s, a) => s + Number(a.amount || 0), 0);
    return totalCredits - totalDebits;
  } else {
    const [txs, adjustments] = await Promise.all([
      Transaction.find({ userId: uid, status: "forwarded" }).lean(),
      BalanceAdjustment.find({ userId: uid }).lean(),
    ]);
    const totalForwarded = txs.reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const totalDebits = adjustments
      .filter((a) => a.type === "deduct")
      .reduce((s, a) => s + Number(a.amount || 0), 0);
    return totalForwarded - totalDebits;
  }
};

// GET /api/v1/users/admin/users-with-balance
export const adminListUsersWithBalance = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}, "name email phone role blocked createdAt") // minimal fields
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    const enriched = await Promise.all(
      users.map(async (u) => {
        const bal = await computeAvailableBalance(u._id);
        return { ...u, availableBalance: bal };
      })
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      hasMore: skip + enriched.length < total,
      users: enriched,
    });
  } catch (err) {
    console.error("adminListUsersWithBalance error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
