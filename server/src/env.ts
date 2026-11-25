import dotenv from "dotenv";
import path from "path";

// Support both running from workspace root and server package directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { z } from "zod";

export const env = z
  .object({
    PORT: z.coerce.number().default(5001),
    FRONTEND_URL: z.string().default("http://localhost:5173"),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/careerpilot"),
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters long")
      .default("default_development_jwt_secret_key_minimum_32_chars"),
    AI_PROVIDER: z
      .enum(["groq", "huggingface", "gemini", "openrouter", "openai", "ollama", "custom"])
      .default((process.env.AI_PROVIDER as any) || "groq"),
    AI_MODEL: z.string().default(process.env.AI_MODEL || "openai/gpt-oss-20b"),
    AI_BASE_URL: z.string().default(""),
    AI_API_KEY: z.string().default(""),
    OPENAI_API_KEY: z.string().default(""),
    GROQ_API_KEY: z.string().default(process.env.GROQ_API_KEY || ""),
    GEMINI_API_KEY: z.string().default(""),
    OPENROUTER_API_KEY: z.string().default(""),
    DAILY_AI_LIMIT: z.coerce.number().default(50),
    HF_TOKEN: z.string().default(process.env.HF_TOKEN || process.env.HF_Token || ""),
    HF_MODEL: z.string().default(process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct"),
  })
  .parse(process.env);
