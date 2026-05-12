import express from "express";
import multer from "multer";
import { matchResumeToJob } from "../controllers/match.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ================= ROUTES =================

router.post(
  "/upload",
  authMiddleware,
  upload.single("resumeFile"), 
  matchResumeToJob
);

router.post("/match", matchResumeToJob);

export default router;