import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/resume.model";
import CoverLetter from "../models/coverLetter.model";

interface CustomRequest extends Request {
  user?: any;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
});

export const generateCoverLetterController = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const {
      selectedResume,
      jobDescription,
      companyName,
      roleName,
      selectedTemplate,
    } = req.body;

    if (!selectedResume || !jobDescription) {
      return res.status(400).json({
        message: "Resume ID and job description required",
      });
    }

    const resume = await Resume.findById(selectedResume);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!resume.generatedText) {
      return res.status(400).json({
        message: "Resume has no content",
      });
    }

    const resumeContent = resume.generatedText;

    let tone = "professional tone";
    if (selectedTemplate === "modern") {
      tone = "modern, confident tone";
    } else if (selectedTemplate === "creative") {
      tone = "creative and engaging tone";
    }

    const prompt = `
Write a professional cover letter.

Role: ${roleName || "Not specified"}
Company: ${companyName || "Not specified"}

Tone: ${tone}

Resume:
${resumeContent}

Job Description:
${jobDescription}

Instructions:
- Match resume with job
- Do NOT add fake info
- Keep it clean and ATS friendly
- Return ONLY cover letter text
`;

    let generatedText = "";

    try {
      const result = await model.generateContent(prompt);
      generatedText = result.response.text();
    } catch (err: any) {
      console.log("Retrying AI...");

      const retry = await model.generateContent(prompt);
      generatedText = retry.response.text();
    }

    if (!generatedText || generatedText.trim() === "") {
      generatedText = `
Dear Hiring Manager,

I am applying for the ${roleName || "position"} role at ${
        companyName || "your company"
      }.

My experience and skills align with your job requirements. I am confident I can contribute effectively.

Thank you for your time and consideration.

Sincerely,
${resume.inputData?.personalInfo?.name || "Candidate"}
`;
    }

    const coverLetter = await CoverLetter.create({
      userId,
      resumeId: selectedResume,
      jobDescription,
      companyName,
      roleName,
      template: selectedTemplate,
      generatedText,
    });

    res.status(200).json({
      message: "Cover letter generated successfully",
      coverLetterId: coverLetter._id,
      generatedCoverLetter: generatedText,
    });
  } catch (error: any) {
    console.error("Cover Letter Error:", error?.message);

    res.status(500).json({
      message: "Failed to generate cover letter",
      error: error?.message,
    });
  }
};