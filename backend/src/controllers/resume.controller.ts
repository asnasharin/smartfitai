import { Request, Response } from "express";
import Resume from "../models/resume.model";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

interface CustomRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
});

//
// ================= UPLOAD RESUME =================
//
export const uploadResume = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id || "anonymous";

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let parsedText = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      parsedText = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const { value } = await mammoth.extractRawText({
        buffer: req.file.buffer,
      });
      parsedText = value;
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    const resume = await Resume.create({
      userId,
      originalFilename: req.file.originalname,
      parsedText,
    });

    res.status(201).json({
      message: "Resume uploaded",
      resumeId: resume._id,
    });
  } catch (error: any) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

//
// ================= ANALYZE RESUME =================
//
export const analyzeResume = async (req: CustomRequest, res: Response) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const prompt = `
Analyze resume and return JSON:

{
  "overallScore": number,
  "categoryScores": {
    "formatting": number,
    "content": number,
    "keywords": number,
    "impact": number
  },
  "suggestions": [],
  "strengths": []
}

Resume:
${resume.parsedText}
`;

    let aiText = "";

    try {
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
    } catch {
      // retry for 503 error
      const retry = await model.generateContent(prompt);
      aiText = retry.response.text();
    }

    let analysis: any = {
      overallScore: 60,
      categoryScores: {
        formatting: 60,
        content: 60,
        keywords: 60,
        impact: 60,
      },
      suggestions: ["Improve formatting"],
      strengths: ["Basic structure is okay"],
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

    resume.analysis = {
      ...analysis,
      analysisTimestamp: new Date(),
    };

    await resume.save();

    res.status(200).json({
      message: "Resume analyzed",
      analysis,
    });
  } catch (error: any) {
    console.error("Analyze Error:", error.message);
    res.status(500).json({ message: "Analysis failed" });
  }
};

//
// ================= GET RESUMES =================
//
export const getUploadedResumes = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ resumes });
  } catch (error: any) {
    res.status(500).json({ message: "Fetch failed" });
  }
};