import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    companyName: String,
    roleName: String,
    template: {
      type: String,
      enum: ["default", "modern", "creative"],
      default: "default",
    },
    generatedText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CoverLetter", coverLetterSchema);