import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { register,login,refresh,logout } from "../controllers/authController.js";
import { registerSchema,loginSchema } from "../validators/authValidator.js";
import validate from "../middleware/validate.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(login)
);
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

router.post("/refresh", asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));
export default router;
