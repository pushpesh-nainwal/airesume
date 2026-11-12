import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const user = await User.findById(decoded.sub);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user"
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token"
    });
  }
};
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource"
      });
    }

    next();
  };
};