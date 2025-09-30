// dbConnect.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing");
}

// Reuse the same connection across serverless invocations
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // fail fast instead of buffering queries
    mongoose.set("bufferCommands", false);
    mongoose.set("strictQuery", true);

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "rupexo",
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        retryWrites: true,
      })
      .then((m) => {
        const conn = m.connection;
        conn.on("connected", () => console.log("✅ Mongo connected"));
        conn.on("error", (err) => console.error("❌ Mongo error:", err));
        return conn;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
