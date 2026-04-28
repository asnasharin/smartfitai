import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    jobDescription: {
      type: String,
      required: true,
    },
    analysis: {
      matchScore: Number,
      missingKeywords: [String],
      matchingKeywords: [String],
      suggestions: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);