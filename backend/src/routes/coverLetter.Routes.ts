import express from "express";
import { generateCoverLetterController } from "../controllers/coverLetter.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/generate", authMiddleware, generateCoverLetterController);

export default router;