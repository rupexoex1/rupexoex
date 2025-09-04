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

  // 💸 withdrawals (NEW)
  createWithdrawal,      // POST /withdrawals (user)
  getMyWithdrawals,      // GET  /withdrawals (user)  [optional UI]
} from "../controllers/userController.js";

import {
  getAdminStats,
  getAllTransactions,
  updateOrderStatus,
  getAllOrders,

  // 💸 withdrawals admin (NEW)
  adminListWithdrawals,          // GET /admin/withdrawals
  adminUpdateWithdrawalStatus,   // PUT /admin/withdrawals/:id
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
  async (_req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, users });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to fetch users" });
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
        return res.status(400).json({ success: false, message: "Invalid role value" });
      }

      const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Update role error:", err.message);
      res.status(500).json({ success: false, message: "Failed to update user role" });
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

/* ========== 💸 Withdrawals (ADMIN) — NEW ========== */
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

/* ========== 💸 Withdrawals (USER) — NEW ========== */
// Create a withdrawal request
userRoutes.post("/withdrawals", verifyToken, createWithdrawal);

// (Optional) List my own withdrawal requests for a "My Withdrawals" page
userRoutes.get("/withdrawals", verifyToken, getMyWithdrawals);

/* =========================
   Public route
========================= */
userRoutes.get("/public-info", publicInfo);

export default userRoutes;
