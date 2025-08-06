import express from "express";
import User from "../models/userModel.js";
import Rate from "../models/rateModel.js";

import {
  adminLogin,
  managerLogin,
  publicInfo,
  userLogin,
  checkUSDTDeposit,
  getUserTransactions,
  getVirtualBalance,
  addBankAccount,
  getBankAccounts,
  deleteBankAccount,
  selectBankAccount,
  getSelectedBankAccount,
  placeOrder,
  getUserOrders,
  getOrderById,
} from "../controllers/userController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import {
  getAdminStats,
  getAllTransactions,
  updateOrderStatus,
  getAllOrders
} from "../controllers/adminController.js";

const userRoutes = express.Router();

// Only admin can access this router
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
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, users });
    } catch (err) {
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

// Both admin and manager can access this router
userRoutes.get(
  "/manager",
  verifyToken,
  authorizeRoles("admin", "manager"),
  managerLogin
);
userRoutes.put(
  "/rates",
  verifyToken,
  authorizeRoles("admin", "manager"),
  async (req, res) => {
    try {
      const { basic, vip } = req.body;

      let rate = await Rate.findOne();
      if (rate) {
        rate.basic = basic;
        rate.vip = vip;
        await rate.save();
      } else {
        await Rate.create({ basic, vip });
      }

      res.json({ success: true, message: "Rates updated successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Failed to update rates" });
    }
  }
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

// All authenticated/registered users can access this router
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
userRoutes.post("/accounts", verifyToken, addBankAccount);
userRoutes.get("/accounts", verifyToken, getBankAccounts);
userRoutes.delete("/accounts/:id", verifyToken, deleteBankAccount);
userRoutes.put("/accounts/select/:id", verifyToken, selectBankAccount);
userRoutes.get("/accounts/selected", verifyToken, getSelectedBankAccount);
userRoutes.post("/orders", verifyToken, placeOrder);
userRoutes.get("/orders", verifyToken, getUserOrders);
userRoutes.get("/orders/:id", verifyToken, getOrderById);

// All unauthenticated/unregistered users can access this router
userRoutes.get("/public-info", publicInfo);
userRoutes.get("/rates", async (req, res) => {
  try {
    let rate = await Rate.findOne();
    if (!rate) {
      rate = await Rate.create({ basic: "91.50", vip: "94.00" });
    }
    res.json(rate);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch rates" });
  }
});

export default userRoutes;
