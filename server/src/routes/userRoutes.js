import express from "express";
import User from "../models/userModel.js";

import {
  adminLogin,
  managerLogin,
  publicInfo,
  userLogin,
} from "../controllers/userController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import {
  checkUSDTDeposit,
  getUserTransactions,
} from "../controllers/userController.js";
import {
  getAdminStats,
  getAllTransactions,
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

// All authenticated/registered users can access this router
userRoutes.get(
  "/user",
  verifyToken,
  authorizeRoles("admin", "manager", "user"),
  userLogin
);

// All unauthenticated/unregistered users can access this router
userRoutes.get("/public-info", publicInfo);

userRoutes.post("/check-deposit", verifyToken, checkUSDTDeposit);
userRoutes.get("/transactions", verifyToken, getUserTransactions);

export default userRoutes;
