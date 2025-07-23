import express from "express";

import {
  adminLogin,
  managerLogin,
  publicInfo,
  userLogin,
} from "../controllers/userController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const userRoutes = express.Router();

// Only admin can access this router
userRoutes.get("/admin", verifyToken, authorizeRoles("admin"), adminLogin);

// Both admin and manager can access this router
userRoutes.get("/manager", verifyToken, authorizeRoles("admin", "manager"), managerLogin);

// All authenticated/registered users can access this router
userRoutes.get("/user", verifyToken, authorizeRoles("admin", "manager", "user"), userLogin);

// All unauthenticated/unregistered users can access this router
userRoutes.get("/public-info", publicInfo)

export default userRoutes;
