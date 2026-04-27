import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument, StandardFonts } from "pdf-lib";
import Resume from "../models/resume.model";

interface CustomRequest extends Request {
  user?: any;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const formatInputForPrompt = (data: any): string => {
  let promptData = ``;

  promptData += `Personal Information:
Name: ${data.personalInfo?.name}
Email: ${data.personalInfo?.email}
${data.personalInfo?.phone ? `Phone: ${data.personalInfo.phone}` : ""}
${data.personalInfo?.linkedin ? `LinkedIn: ${data.personalInfo.linkedin}` : ""}

`;

  if (data.summary) {
    promptData += `Summary:\n${data.summary}\n\n`;
  }

  if (data.education) {
    promptData += `Education:\n${data.education
      .map((e: any) => `- ${e.degree} at ${e.institution}`)
      .join("\n")}\n\n`;
  }

  if (data.experience) {
    promptData += `Experience:\n${data.experience
      .map(
        (e: any) =>
          `- ${e.jobTitle} at ${e.company}\n  ${e.responsibilities?.join(", ")}`
      )
      .join("\n\n")}\n\n`;
  }

  if (data.skills) {
    promptData += `Skills:\n${data.skills
      .map((s: any) => s.items?.join(", "))
      .join("\n")}\n\n`;
  }

  if (data.targetJobRole) {
    promptData += `Target Role: ${data.targetJobRole}`;
  }

  return promptData;
};

export const generateResume = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const inputData = req.body;

    if (!inputData || !inputData.personalInfo) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const formattedInput = formatInputForPrompt(inputData);

    const prompt = `
Generate a professional resume based on this data:

${formattedInput}

Make it clean, structured, and ATS-friendly.
`;

    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    const resume = await Resume.create({
      userId,
      inputData,
      generatedText,
    });

    res.status(201).json({
      message: "Resume generated successfully",
      resumeId: resume._id,
      generatedText,
    });

  } catch (error) {
    console.error("Generate Error:", error);
    res.status(500).json({ message: "Failed to generate resume" });
  }
};



export const downloadGeneratedResume = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(resume.generatedText || "", {
      x: 50,
      y: 700,
      size: 10,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=resume_${id}.pdf`
    );

    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
};


export const getGeneratedResumes = async (req: CustomRequest, res: Response) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    const formatted = resumes.map((r) => ({
      id: r._id,
      createdAt: r.createdAt,
      inputName: r.inputData?.personalInfo?.name,
      inputTargetRole: r.inputData?.targetJobRole,
    }));

    res.status(200).json({ generatedResumes: formatted });

  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Error fetching resumes" });
  }
};


export const getResumeById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(resume);

  } catch (error) {
    res.status(500).json({ message: "Error fetching resume" });
  }
};


export const deleteResume = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (resume.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await resume.deleteOne();

    res.status(200).json({ message: "Resume deleted" });

  } catch (error) {
    res.status(500).json({ message: "Error deleting resume" });
  }
};