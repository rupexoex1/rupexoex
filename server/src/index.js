// server/src/index.js
import express from "express";
import "dotenv/config";
import cors from "cors";
import compression from "compression";
import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ratesRoutes from "./routes/ratesRoutes.js";
import { startDepositCron } from "./cronJobs/depositChecker.js";

const app = express();

// pehle connect — buffer se bachne ke liye
await dbConnect();               // <- IMPORTANT

app.use(cors({
  origin(origin, cb) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:7001",
      "https://rupexo.com",
      "https://www.rupexo.com",
      "https://rupexo-backend.vercel.app",
      "https://rupexo-seven.vercel.app"
    ];
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(compression());

// payload guard (as-is)
app.use((req, res, next) => {
  const send = res.json.bind(res);
  res.json = (data) => {
    try {
      const s = JSON.stringify(data);
      const bytes = Buffer.byteLength(s, "utf8");
      res.setHeader("x-payload-bytes", String(bytes));
      if (bytes > 4_200_000) {
        return res.status(413).json({
          success: false,
          message: "Response too large. Use pagination / filters."
        });
      }
    } catch {}
    return send(data);
  };
  next();
});

app.use(express.json());

// DB ready ke baad hi cron start karo
startDepositCron();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", ratesRoutes);

export default app;
