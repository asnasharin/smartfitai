import express from "express";
import { getTips } from "../controllers/tips.controller";

const router = express.Router();


router.get("/", getTips);

export default router;