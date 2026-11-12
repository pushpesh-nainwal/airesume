import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Candidate from "../models/Candidate.js";
import Recruiter from "../models/Recruiter.js";
import { generateAccessToken,generateRefreshToken, hashToken} from "../utils/tokenUtils.js";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Check existing user
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email is already registered"
    });
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
    role
  });

  // 4. Create role-specific profile
  if (role === "candidate") {
    await Candidate.create({
      user: user._id
    });
  } else if (role === "recruiter") {
    await Recruiter.create({
      user: user._id
    });
  }

  // 5. Send response
  res.status(201).json({
    success: true,
    message: "Registration successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user and include passwordHash
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  // 3. Check account status
  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your account is suspended or banned"
    });
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 5. Store refresh token hash
  user.refreshTokens.push(hashToken(refreshToken));
  await user.save();

  // 6. Set refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // 7. Send response
  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing"
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.REFRESH_SECRET);
  } catch {
    res.clearCookie("refreshToken");
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }

  const user = await User.findById(decoded.sub);

  if (!user || user.status !== "active") {
    res.clearCookie("refreshToken");
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }

  const tokenHash = hashToken(token);
  const tokenIndex = user.refreshTokens.indexOf(tokenHash);

  // Reuse detection
  if (tokenIndex === -1) {
    user.refreshTokens = [];
    await user.save();

    res.clearCookie("refreshToken");

    return res.status(401).json({
      success: false,
      message: "Refresh token reuse detected. Please log in again."
    });
  }

  // Remove old token hash
  user.refreshTokens.splice(tokenIndex, 1);

  // Generate new token pair
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store new refresh token hash
  user.refreshTokens.push(hashToken(refreshToken));

  await user.save();

  // Set new refresh cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(200).json({
    success: true,
    accessToken
  });
};
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

      const user = await User.findById(decoded.sub);

      if (user) {
        const tokenHash = hashToken(token);

        user.refreshTokens = user.refreshTokens.filter(
          (storedToken) => storedToken !== tokenHash
        );

        await user.save();
      }
    } catch {
      // Invalid or expired token: still clear cookie
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};