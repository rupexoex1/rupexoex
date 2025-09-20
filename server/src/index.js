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

// All frontend from port 5173
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:7001",
  "https://rupexo.com",
  "https://www.rupexo.com",
  "https://backend.demoavatar.click"
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
startDepositCron();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1", ratesRoutes);


// Start the server
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
  console.log(`Server is running at port: ${PORT}`);
});
