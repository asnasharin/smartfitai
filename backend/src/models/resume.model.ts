import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    originalFilename: String,
    parsedText: String,

    analysis: {
      overallScore: Number,
      categoryScores: {
        formatting: Number,
        content: Number,
        keywords: Number,
        impact: Number,
      },
      suggestions: [String],
      strengths: [String],
      analysisTimestamp: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", ResumeSchema);