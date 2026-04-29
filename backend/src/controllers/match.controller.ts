import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/builder.model";
import Match from "../models/match.model";
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";

interface CustomRequest extends Request {
  user?: any;
  file?: any; 
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

export const matchResumeToJob = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { jobDescription, resumeId, resumeText } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description required" });
    }

    let resumeContent = "";

    // ✅ FILE upload
    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        const data = await (pdfParse as any)(req.file.buffer); // ✅ FIXED
        resumeContent = data.text;
      } 
      else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const { value } = await mammoth.extractRawText({
          buffer: req.file.buffer,
        });
        resumeContent = value;
      } 
      else {
        return res.status(400).json({ message: "Unsupported file type" });
      }
    }

    // ✅ FROM DB
    else if (resumeId) {
      const resume = await Resume.findById(resumeId);

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      if (resume.userId.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      resumeContent = resume.generatedText;
    }

    // ✅ DIRECT TEXT
    else if (resumeText) {
      resumeContent = resumeText;
    } 
    else {
      return res.status(400).json({
        message: "Provide file, resumeId, or resumeText",
      });
    }

    if (!resumeContent.trim()) {
      return res.status(400).json({
        message: "Resume text empty",
      });
    }

    // ✅ PROMPT
    const prompt = `
Analyze resume vs job description.

Return JSON:
{
  "matchScore": number,
  "missingKeywords": [],
  "matchingKeywords": [],
  "suggestions": []
}

Resume:
${resumeContent}

Job Description:
${jobDescription}
`;

    let aiText = "";

    try {
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch {
      const retry = await model.generateContent(prompt);
      aiText = retry.response.text();
    }

    // ✅ SAFE PARSE
    let analysis = {
      matchScore: 60,
      missingKeywords: [],
      matchingKeywords: [],
      suggestions: ["Improve keyword matching"],
    };

    try {
      const jsonMatch =
        aiText.match(/```json\n([\s\S]*?)\n```/) ||
        aiText.match(/(\{[\s\S]*\})/);

      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      }
    } catch {
      console.log("JSON parse failed, using fallback");
    }

    // ✅ SAVE
    const match = await Match.create({
      userId,
      resumeId,
      jobDescription,
      analysis,
    });

    res.status(200).json({
      message: "Match completed",
      matchId: match._id,
      analysis,
    });

  } catch (error: any) {
    console.error("Match Error:", error?.message);

    res.status(500).json({
      message: "Failed to match resume",
      error: error?.message,
    });
  }
};