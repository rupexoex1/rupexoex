import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
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
    await mongoose.connect(`${process.env.MONGODB_URI}/rupexo`);
  } catch (error) {
    console.log(`Error is from dbConnect.js file: ${error}`);
  }
};

export default dbConnect;
