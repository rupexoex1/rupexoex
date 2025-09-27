import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI env is missing");
    }

    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully ✅");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Database connection error:", err);
    });

    // Attach your DB name here (rupexo). Keep Atlas string in MONGODB_URI.
    await mongoose.connect(`${uri}/rupexo`);
  } catch (error) {
    console.error("Error is from dbConnect.js:", error);
    // bubble up so deployment fails fast instead of half-running
    throw error;
  }
};

export default dbConnect;
