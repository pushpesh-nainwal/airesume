import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};