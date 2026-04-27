import express from "express";
import {
  generateResume,
  downloadGeneratedResume,
  getGeneratedResumes,
} from "../controllers/builder.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/generate", authMiddleware, generateResume);

router.get("/", authMiddleware, getGeneratedResumes);

router.get("/download/:id", authMiddleware, downloadGeneratedResume);

export default router;