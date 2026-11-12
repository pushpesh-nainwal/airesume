import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    skills: {
      type: [String],
      default: []
    },

    resumeUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;