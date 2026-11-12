import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate"
    },

    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active"
    },

    refreshTokens: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;