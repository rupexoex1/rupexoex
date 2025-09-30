import express from "express";
import "dotenv/config";
import cors from "cors";
import compression from "compression";                 // ← NEW
import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ratesRoutes from "./routes/ratesRoutes.js";
import { startDepositCron } from "./cronJobs/depositChecker.js";

dbConnect();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:7001",
  "https://rupexo.com",
  "https://www.rupexo.com",
  "https://rupexo-server-phi.vercel.app",
  "https://rupexo-one.vercel.app"
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ✅ shrink responses
app.use(compression());

// ✅ add a tiny guard (if someone accidentally returns 5–10MB)
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
startDepositCron();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", ratesRoutes);

const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
  console.log(`Server is running at port: ${PORT}`);
});

export default app;
