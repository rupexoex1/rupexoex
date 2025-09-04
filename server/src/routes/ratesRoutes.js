// routes/ratesRoutes.js
import express from "express";
import { getPublicRates, updateRates } from "../controllers/ratesController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ✅ index.js mounts at /api/v1, so keep relative paths here:
router.get("/users/rates", getPublicRates);
router.put("/admin/rates", verifyToken, authorizeRoles("admin", "manager"), updateRates);

export default router;
