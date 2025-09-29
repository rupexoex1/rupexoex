import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const verifyToken = async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      if (user.blocked) {
        return res.status(403).json({
          code: "ACCOUNT_BLOCKED",
          message: user.blockedReason || "Your account is blocked. Please contact support.",
        });
      }

      next();
    } catch (error) {
      console.error("Token error:", error.message);
      res.status(400).json({ message: "Token is not valid" });
    }
  } else {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

export default verifyToken;