import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  inputData: {
    type: Object,
    required: true,
  },

  generatedText: {
    type: String,
    required: true,
  },

}, { timestamps: true });

export default mongoose.model("Resume", resumeSchema);