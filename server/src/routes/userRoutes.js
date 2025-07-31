import express from "express";

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
import { getAllTransactions } from "../controllers/adminController.js";

const userRoutes = express.Router();

// Only admin can access this router
userRoutes.get("/admin", verifyToken, authorizeRoles("admin"), adminLogin);
userRoutes.get(
  "/admin/transactions",
  verifyToken,
  authorizeRoles("admin", "manager"),
  getAllTransactions
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
