// routes/ratesRoutes.js
import express from "express";
import { getPublicRates, updateRates } from "../controllers/ratesController.js";
// import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public (your AppContext already calls /api/v1/users/rates)
router.get("/api/v1/users/rates", getPublicRates);

// Admin (protect this)
router.put(
  "/api/v1/admin/rates",
  // requireAuth, requireRole("admin"),
  updateRates
);

export default router;
