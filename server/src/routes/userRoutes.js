// routes/userRoutes.js
import express from "express";
import User from "../models/userModel.js";

import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

import {
  // auth / user basics
  adminLogin,
  managerLogin,
  publicInfo,
  userLogin,

  // wallet & txns
  checkUSDTDeposit,
  getUserTransactions,
  getVirtualBalance,

  // bank accounts
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  selectBankAccount,
  getSelectedBankAccount,

  // orders
  placeOrder,
  getUserOrders,
  getOrderById,

  // settings & admin balance adj
  getSettings,
  updateSettings,
  adminAdjustUserBalance,

  // 💸 withdrawals (USER)
  createWithdrawal, // POST /withdrawals
  getMyWithdrawals, // GET  /withdrawals (list mine)
  getWithdrawalById, // NEW: GET  /withdrawals/:id (tracking)
  adminGetUserBalance,
} from "../controllers/userController.js"; // <-- ensure getWithdrawalById is exported there

import {
  getAdminStats,
  getAllTransactions,
  updateOrderStatus,
  getAllOrders,

  // 💸 withdrawals admin
  adminListWithdrawals, // GET /admin/withdrawals
  adminUpdateWithdrawalStatus, // PUT /admin/withdrawals/:id
  adminListUsersWithBalance,
} from "../controllers/adminController.js";

const userRoutes = express.Router();

/* =========================
   Health
========================= */
userRoutes.get("/__ping", (req, res) => {
  res.json({
    ok: true,
    mount: "/api/v1/users",
    time: new Date().toISOString(),
  });
});

/* =========================
   Admin-only routes
========================= */
userRoutes.get("/admin", verifyToken, authorizeRoles("admin"), adminLogin);

userRoutes.get(
  "/admin/transactions",
  verifyToken,
  authorizeRoles("admin", "manager"),
  getAllTransactions
);

userRoutes.get(
  "/admin/dashboard-stats",
  verifyToken,
  authorizeRoles("admin", "manager"),
  getAdminStats
);

userRoutes.get(
  "/admin/users",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // cap 100
      const q = (req.query.q || "").trim();

      const filter = q
        ? {
            $or: [
              { name: new RegExp(q, "i") },
              { email: new RegExp(q, "i") },
              { phone: new RegExp(q, "i") },
            ],
          }
        : {};

      const projection = "-password -__v -blockedReason";

      const [items, total] = await Promise.all([
        User.find(filter, projection)
          .sort({ _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        page,
        limit,
        total,
        hasMore: page * limit < total,
        users: items,
      });
    } catch (err) {
      console.error("Admin users fetch error:", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch users" });
    }
  }
);

userRoutes.patch(
  "/admin/users/:id/role",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["admin", "manager", "user"].includes(role)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid role value" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );
      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Update role error:", err.message);
      res
        .status(500)
        .json({ success: false, message: "Failed to update user role" });
    }
  }
);

// ✅ Block / Unblock user
userRoutes.patch(
  "/admin/users/:id/block",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { blocked, reason } = req.body; // boolean + optional

      if (typeof blocked !== "boolean") {
        return res
          .status(400)
          .json({ success: false, message: "blocked must be boolean" });
      }

      const update = {
        blocked,
        blockedReason: blocked ? reason || "" : "",
        blockedAt: blocked ? new Date() : null,
        blockedBy: blocked ? req.user?._id || null : null,
      };

      const updatedUser = await User.findByIdAndUpdate(id, update, {
        new: true,
      });
      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        message: blocked ? "User blocked" : "User unblocked",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Toggle block error:", err.message);
      res
        .status(500)
        .json({ success: false, message: "Failed to update block status" });
    }
  }
);

userRoutes.get(
  "/admin/settings",
  verifyToken,
  authorizeRoles("admin"),
  getSettings
);

userRoutes.put(
  "/admin/settings",
  verifyToken,
  authorizeRoles("admin"),
  updateSettings
);

userRoutes.post(
  "/admin/users/:id/adjust-balance",
  verifyToken,
  authorizeRoles("admin"),
  adminAdjustUserBalance
);

/* =========================
   Admin + Manager routes
========================= */
userRoutes.get(
  "/manager",
  verifyToken,
  authorizeRoles("admin", "manager"),
  managerLogin
);

userRoutes.put(
  "/admin/orders/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  updateOrderStatus
);

userRoutes.get(
  "/admin/orders",
  verifyToken,
  authorizeRoles("admin", "manager"),
  getAllOrders
);

userRoutes.get(
  "/admin/balance/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  adminGetUserBalance
);

userRoutes.get(
  "/admin/users-with-balance",
  verifyToken,
  authorizeRoles("admin", "manager"),
  adminListUsersWithBalance
);

/* ========== 💸 Withdrawals (ADMIN) ========== */
userRoutes.get(
  "/admin/withdrawals",
  verifyToken,
  authorizeRoles("admin", "manager"),
  adminListWithdrawals
);

userRoutes.put(
  "/admin/withdrawals/:id",
  verifyToken,
  authorizeRoles("admin", "manager"),
  adminUpdateWithdrawalStatus
);

/* =========================
   Authenticated User routes
========================= */
userRoutes.get(
  "/user",
  verifyToken,
  authorizeRoles("admin", "manager", "user"),
  userLogin
);

userRoutes.post("/check-deposit", verifyToken, checkUSDTDeposit);

userRoutes.get("/transactions", verifyToken, getUserTransactions);

userRoutes.get(
  "/balance",
  verifyToken,
  authorizeRoles("admin", "manager", "user"),
  getVirtualBalance
);

/* =========================
   Bank Accounts
========================= */
userRoutes.post("/accounts", verifyToken, addBankAccount);
userRoutes.get("/accounts", verifyToken, getBankAccounts);
userRoutes.delete("/accounts/:id", verifyToken, deleteBankAccount);
userRoutes.put("/accounts/select/:id", verifyToken, selectBankAccount);
userRoutes.get("/accounts/selected", verifyToken, getSelectedBankAccount);

/* =========================
   Orders
========================= */
userRoutes.post("/orders", verifyToken, placeOrder);
userRoutes.get("/orders", verifyToken, getUserOrders);
userRoutes.get("/orders/:id", verifyToken, getOrderById);

/* ========== 💸 Withdrawals (USER) ========== */
// NEW: Single withdrawal for tracking page
userRoutes.get("/withdrawals/:id", verifyToken, getWithdrawalById); // NEW

// Create a withdrawal request
userRoutes.post("/withdrawals", verifyToken, createWithdrawal);

// My withdrawals list (optional page)
userRoutes.get("/withdrawals", verifyToken, getMyWithdrawals);

/* =========================
   Public route
========================= */
userRoutes.get("/public-info", publicInfo);

export default userRoutes;
