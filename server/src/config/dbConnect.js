// server/src/config/dbConnect.js
import mongoose from "mongoose";

let isConnected = 0; // 0=not connected, 1=connected

// Prod me fail-fast better hota hai
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

export default async function dbConnect() {
  if (isConnected === 1) return true;

  // 🔹 ENV key ko yahan align karein (MONGO_URI suggest karta hoon)
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Mongo connection string missing: set MONGO_URI in .env");
  }

  // Listeners ek hi dafa lagayen
  if (mongoose.connection.listeners("connected").length === 0) {
    mongoose.connection.once("connected", () => {
      isConnected = 1;
      console.log("✅ Database connected");
    });
  }
  if (mongoose.connection.listeners("error").length === 0) {
    mongoose.connection.on("error", (err) => {
      isConnected = 0;
      console.error("❌ Database connection error:", err);
    });
  }
  if (mongoose.connection.listeners("disconnected").length === 0) {
    mongoose.connection.on("disconnected", () => {
      isConnected = 0;
      console.warn("⚠️ Database disconnected");
    });
  }

  // Important options
  await mongoose.connect(uri, {
    dbName: "rupexo",
    serverSelectionTimeoutMS: 10000, // wohi 10s, but explicit
    maxPoolSize: 10,
    // keepAlive: true,
    // retryWrites: true, // SRV string me hota hai, optional
  });

  return true;
}
