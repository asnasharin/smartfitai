import express from "express";
import multer from "multer";
import { matchResumeToJob } from "../controllers/match.controller";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ================= ROUTES =================

router.post(
  "/match/upload",
  upload.single("resume"), 
  matchResumeToJob
);

router.post("/match", matchResumeToJob);

export default router;