import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    companyName: {
      type: String,
      default: ""
    },

    companyWebsite: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

export default Recruiter;