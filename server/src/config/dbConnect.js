import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    // Event: Database successfully connected
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully ✅");
    });

    // Event: Database connection throws error
    mongoose.connection.on("error", (err) => {
      console.log("❌ Database connection error: " + err);
    });
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "rupexo",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      retryWrites: true,
    });
  } catch (error) {
    console.log(`Error is from dbConnect.js file: ${error}`);
  }
};

export default dbConnect;
