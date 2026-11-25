import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { env } from "./env";
import { requireAuth, requireRole } from "./middleware/auth";
import { errorHandler, ah } from "./middleware/error";
import { SystemSetting } from "./models";
import { demoMode, getEffectiveModel } from "./services/ai";
import { authRouter } from "./routes/auth";
import { profile } from "./routes/profile";
import { interviews } from "./routes/interviews";
import { skills } from "./routes/skills";
import { applications } from "./routes/applications";
import { resumeRouter } from "./routes/resumes";
import { careerRouter } from "./routes/career";
import { adminRoutes } from "./routes/admin";
import { aiRouter } from "./routes/ai";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = new Set(
  env.FRONTEND_URL.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.has("*") || allowedOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }
      // Clean rejection without throwing 500 internal server error
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json({ limit: "5mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const aiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please try again shortly." },
});

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    aiDemoMode: demoMode(),
    aiProvider: env.AI_PROVIDER,
    aiModel: getEffectiveModel(),
    database: "mongodb",
  })
);

app.get(
  "/api/announcement",
  ah(async (_req, res) => {
    const setting = await SystemSetting.findOne({ key: "announcement" }).lean();
    res.json(setting?.value || { active: false, text: "", type: "info" });
  })
);

// Public Auth and AI routes
app.use("/api/auth", authRateLimit, authRouter);
app.use("/api/ai", aiRateLimit, aiRouter);

// Protected application routes
app.use("/api/profile", requireAuth, profile);
app.use("/api/resumes", requireAuth, resumeRouter);
app.use("/api/resume", requireAuth, resumeRouter);
app.use("/api/career", requireAuth, careerRouter);
app.use("/api/interviews", requireAuth, interviews);
app.use("/api/skill-analyses", requireAuth, skills);
app.use("/api/skills", requireAuth, skills);
app.use("/api/applications", requireAuth, applications);
app.use("/api/admin", requireAuth, adminRoutes);

// In production or unified deployments: serve client build if present
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(errorHandler);

