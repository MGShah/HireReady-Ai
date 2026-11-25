import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { ah } from "../middleware/error";
import { askGroq, DEFAULT_GROQ_MODEL, generateResumeSummary } from "../services/groq";
import { askHuggingFace } from "../services/huggingface";
import { callProvider, getEffectiveModel } from "../services/ai";
import { AiUsageLog } from "../models/AiUsageLog";
import { env } from "../env";

export const aiRouter = Router();

const askSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(3000, "Question cannot exceed 3000 characters"),
  model: z.string().trim().optional(),
});

aiRouter.post(
  "/ask",
  ah(async (req, res) => {
    const { question, model } = askSchema.parse(req.body);

    // Optional user identification from JWT Authorization header if present
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      try {
        const token = authHeader.substring(7).trim();
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch {
        /* Optional token verification fails gracefully */
      }
    }

    let result: {
      answer: string;
      model: string;
      demo?: boolean;
      notice?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    if (env.AI_PROVIDER === "groq") {
      result = await askGroq(question, model);
    } else if (env.AI_PROVIDER === "huggingface") {
      result = await askHuggingFace(question, model);
    } else {
      const answer = await callProvider(
        "You are Nexa AI, an expert career mentor and interview coach. Provide clear, actionable, prompt-specific career advice.",
        question
      );
      result = {
        answer: answer.trim(),
        model: model?.trim() || getEffectiveModel(),
        demo: false,
      };
    }

    // If authenticated user, log usage in AiUsageLog
    if (userId) {
      await AiUsageLog.create({
        user_id: userId,
        feature: "groq_ask",
        provider: env.AI_PROVIDER,
        model: result.model,
        request_tokens: result.usage?.prompt_tokens ?? null,
        response_tokens: result.usage?.completion_tokens ?? null,
        created_at: new Date(),
        success: true,
      }).catch((logErr) => console.warn("Failed to write AiUsageLog:", logErr));
    }

    res.json({
      success: true,
      question,
      answer: result.answer,
      model: result.model,
      provider: env.AI_PROVIDER,
      demo: result.demo ?? false,
      ...(result.notice ? { notice: result.notice } : {}),
      usage: result.usage,
    });
  })
);

const resumeSummarySchema = z.object({
  resumeText: z.string().min(1, "Resume text is required"),
});

aiRouter.post(
  "/resume-summary",
  ah(async (req, res) => {
    const { resumeText } = resumeSummarySchema.parse(req.body);
    const summary = await generateResumeSummary(resumeText);

    res.json({
      success: true,
      summary,
      model: env.AI_MODEL.trim() || DEFAULT_GROQ_MODEL,
      provider: "groq",
    });
  })
);

const coverLetterSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  skills: z.string().optional(),
});

aiRouter.post(
  "/cover-letter",
  ah(async (req, res) => {
    const { company, title, skills } = coverLetterSchema.parse(req.body);

    const prompt = `Write a compelling, professional 3-paragraph outreach cover letter for a ${title} position at ${company}. Candidate competencies: ${skills || "Full Stack Engineering, problem-solving, and building high-performance web applications"}. Keep it concise, confident, and focused on delivering immediate business impact.`;

    const result = await askGroq(prompt);

    res.json({
      success: true,
      company,
      title,
      letter: result.answer,
      provider: "groq",
    });
  })
);
