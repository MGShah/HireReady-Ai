import Groq from "groq-sdk";
import { env } from "../env";
import { AppError } from "../middleware/error";

let cachedGroq: Groq | null = null;
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
export const GROQ_CANDIDATE_MODELS = [
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
];

export function getGroqClient(): Groq {
  const apiKey = env.GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim() || "";
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new AppError(
      400,
      "GROQ_API_KEY is not configured in server/.env. Please get a free key at https://console.groq.com/keys"
    );
  }
  if (!cachedGroq) {
    cachedGroq = new Groq({ apiKey });
  }
  return cachedGroq;
}

export function isGroqConfigured(): boolean {
  const key = env.GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim() || "";
  return Boolean(key && key !== "your_groq_api_key_here");
}

export interface GroqChatResponse {
  answer: string;
  model: string;
  demo?: boolean;
  notice?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function getFallbackCareerAdvice(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("interview") || q.includes("prepare")) {
    return [
      "Here is a recommended strategy to prepare effectively:",
      "1. Core Technical Mastery: Review foundational data structures, system design basics, and framework lifecycles.",
      "2. The STAR Method: Structure behavioral answers using Situation, Task, Action, and Result with quantifiable outcomes.",
      "3. Mock Practice: Practice talking through your problem-solving approach out loud before coding.",
      "4. Questions for the Interviewer: Ask about team architecture, deployment frequency, and current engineering challenges.",
    ].join("\n\n");
  }

  if (q.includes("skill") || q.includes("learn") || q.includes("full stack") || q.includes("developer")) {
    return [
      "Key high-demand skills to focus on:",
      "1. Frontend Excellence: TypeScript, React 18/19, state management, and modern responsive styling.",
      "2. Backend & Systems: Node.js/Express, REST/GraphQL APIs, database optimization (MongoDB/PostgreSQL), and caching.",
      "3. Cloud & DevOps: Docker containerization, CI/CD pipelines, and cloud deployment basics (AWS/GCP/Vercel).",
      "4. Code Quality: Unit testing (Vitest/Jest), clean architecture, and git workflow collaboration.",
    ].join("\n\n");
  }

  if (q.includes("resume") || q.includes("ats")) {
    return [
      "Key guidelines for an impactful ATS resume:",
      "1. Action-Oriented Impact: Use the formula: 'Accomplished [X] as measured by [Y] by doing [Z]'.",
      "2. Tailored Keywords: Align your technical skills section directly with the target job description.",
      "3. Clean Structure: Stick to single-column, clear headings, and avoid tables or unparseable graphics.",
      "4. Demonstrable Projects: Include live demo URLs and GitHub repositories with clean README documentation.",
    ].join("\n\n");
  }

  return [
    `Regarding your inquiry: "${question}"`,
    "Career growth in software engineering is driven by continuous hands-on building, delivering measurable business value, and strong technical communication.",
    "Focus on architecting clean, maintainable systems, staying curious about underlying fundamentals, and seeking regular peer feedback.",
  ].join("\n\n");
}

export async function generateResumeSummary(resumeText: string): Promise<string> {
  const primaryModel = env.AI_MODEL.trim() || DEFAULT_GROQ_MODEL;
  const candidateModels = [primaryModel, ...GROQ_CANDIDATE_MODELS].filter(
    (m, idx, arr) => m && arr.indexOf(m) === idx
  );

  try {
    const groq = getGroqClient();
    for (const model of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a career advisor. Create a professional, concise resume summary based only on the provided information.",
            },
            {
              role: "user",
              content: resumeText,
            },
          ],
          temperature: 0.4,
        });

        const text = response.choices[0]?.message?.content?.trim();
        if (text) return text;
      } catch (err: any) {
        const msg = String(err?.message || "");
        if (msg.includes("404") || msg.includes("model_not_found") || msg.includes("does not exist")) {
          continue;
        }
        throw err;
      }
    }
    return `Results-driven software engineer with demonstrated experience in architecting scalable systems and modern web applications. Proficient in delivering high-impact solutions, collaborating across cross-functional teams, and maintaining robust code standards.`;
  } catch (err: any) {
    console.warn("[Groq generateResumeSummary notice]:", err.message || err);
    return `Results-driven software engineer with demonstrated experience in architecting scalable systems and modern web applications. Proficient in delivering high-impact solutions, collaborating across cross-functional teams, and maintaining robust code standards.`;
  }
}

export async function askGroq(
  question: string,
  modelOverride?: string
): Promise<GroqChatResponse> {
  const primaryModel = modelOverride?.trim() || env.AI_MODEL.trim() || DEFAULT_GROQ_MODEL;
  const candidateModels = [primaryModel, ...GROQ_CANDIDATE_MODELS].filter(
    (m, idx, arr) => m && arr.indexOf(m) === idx
  );

  try {
    const groq = getGroqClient();
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are Nexa AI, an expert career mentor, software engineering lead, and interview coach. When Talent Meets Intelligence: provide clear, actionable, well-structured, and helpful advice tailored to technology and professional career growth.",
            },
            {
              role: "user",
              content: question,
            },
          ],
          temperature: 0.5,
          max_tokens: 1200,
        });

        const answer = response.choices[0]?.message?.content?.trim() ?? "";
        if (answer) {
          return {
            answer,
            model,
            demo: false,
            usage: response.usage
              ? {
                  prompt_tokens: response.usage.prompt_tokens,
                  completion_tokens: response.usage.completion_tokens,
                  total_tokens: response.usage.total_tokens,
                }
              : undefined,
          };
        }
      } catch (err: any) {
        lastError = err;
        const msg: string = err?.message || String(err);
        if (
          msg.includes("model_not_found") ||
          msg.includes("does not exist") ||
          msg.includes("404")
        ) {
          console.warn(`[Groq Model Fallback] Model '${model}' not available, trying next candidate...`);
          continue;
        }
        throw err;
      }
    }

    if (lastError) throw lastError;
    throw new AppError(502, "Groq returned empty response across all candidate models.");
  } catch (err: any) {
    if (err instanceof AppError && err.status !== 400) throw err;
    console.warn(`[Groq Service Error] Model: ${primaryModel}`, err.message || err);

    const msg: string = err?.message || String(err);

    if (
      msg.includes("GROQ_API_KEY") ||
      msg.includes("401") ||
      msg.includes("Unauthorized") ||
      msg.includes("invalid_api_key")
    ) {
      throw new AppError(401, "Groq API key is missing or invalid.");
    }

    if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("Rate limit")) {
      throw new AppError(429, "Groq rate limit reached. Please wait a moment and try again.");
    }

    throw new AppError(502, `Groq API error: ${msg}`);
  }
}
