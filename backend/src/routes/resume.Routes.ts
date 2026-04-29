import express from "express";
import multer from "multer";
import {
  uploadResume,
  analyzeResume,
  getUploadedResumes,
} from "../controllers/resume.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("resume"), uploadResume);

router.post("/analyze/:resumeId", analyzeResume);

router.get("/", getUploadedResumes);

export default router;