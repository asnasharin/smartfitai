import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import authRoutes from "./routes/auth.Routes";
import builderRoutes from "./routes/builder.Routes";
import coverletterRoutes from "./routes/coverLetter.Routes";
import matchRoutes from "./routes/match.Route";
import resumeRoutes from "./routes/resume.Routes";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/builder", builderRoutes);
app.use("/api/coverletter", coverletterRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/", (req, res) => {
  res.send("Server running");
});

export default app;