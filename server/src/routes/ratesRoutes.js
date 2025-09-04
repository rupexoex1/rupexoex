import express from "express";
import { getPublicRates, updateRates } from "../controllers/ratesController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

// GET /api/v1/rates  (public)
router.get("/rates", getPublicRates);

// PUT /api/v1/admin/rates  (admin/manager only)
router.put(
  "/admin/rates",
  verifyToken,
  authorizeRoles("admin", "manager"),
  updateRates
);

export default router;
