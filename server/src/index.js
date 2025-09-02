import express from "express";
import "dotenv/config";
import cors from "cors";
import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ratesRoutes from "./routes/ratesRoutes.js";
import { startDepositCron } from "./cronJobs/depositChecker.js";

dbConnect();
const app = express();

/* ---------------- CORS (FIX) ---------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "https://rupexo.vercel.app",
  "https://rupexo.salite.site",
  "https://www.rupexo.salite.site",
  // NOTE: API origin ko allow list me rakhna theek hai, par FE→API call me yeh origin nahi hota.
  // "https://rupexoex-dev.salite.site",
];

const corsOptions = {
  origin(origin, cb) {
    // health checks / server-to-server (no Origin) ko allow
    if (!origin) return cb(null, true);
    return allowedOrigins.includes(origin)
      ? cb(null, true)
      : cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204, // some proxies like 204 on OPTIONS
};

// ⭐ Must be BEFORE any routes
app.use(cors(corsOptions));
// ⭐ Ensure preflight is answered for any path
app.options("*", cors(corsOptions));

/* -------------- Optional: debug preflight -------------- */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log("CORS preflight from:", req.headers.origin, "->", req.originalUrl);
  }
  next();
});

/* ---------------- Middlewares ---------------- */
app.use(express.json());
startDepositCron();

/* ---------------- Routes ---------------- */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
// If ratesRoutes ke andar absolute paths hain (e.g. '/api/v1/users/rates'),
// to yahan base prefix ki zaroorat nahi. Ye line sahi hai:
app.use(ratesRoutes);

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
  console.log(`Server is running at port: ${PORT}`);
});
