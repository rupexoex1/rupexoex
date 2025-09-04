import express from "express";
import { getPublicRates, updateRates } from "../controllers/ratesController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

// GET endpoint for frontend users
router.get("/users/rates", getPublicRates);

// PUT endpoint for admin update
router.put(
  "/admin/rates",
  verifyToken,
  authorizeRoles("admin", "manager"),
  updateRates
);

export default router;
