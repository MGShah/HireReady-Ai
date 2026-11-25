import { InferenceClient } from "@huggingface/inference";
import { env } from "../env";
import { AppError } from "../middleware/error";

let cachedClient: InferenceClient | null = null;

export function getHfClient(): InferenceClient {
  const token = env.HF_TOKEN.trim();
  if (!token) {
    throw new AppError(500, "HF_TOKEN environment variable is not configured in server/.env");
  }
  if (!cachedClient) {
    cachedClient = new InferenceClient(token);
  }
  return cachedClient;
}

export interface HfChatResponse {
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

function getFallbackCareerAdvice(question: string): string {
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

export async function askHuggingFace(
  question: string,
  modelOverride?: string
): Promise<HfChatResponse> {
  const client = getHfClient();
  const model = modelOverride?.trim() || env.HF_MODEL.trim() || "meta-llama/Llama-3.1-8B-Instruct";

  try {
    const response = await client.chatCompletion({
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
      max_tokens: 1000,
      temperature: 0.7,
    });

    const answer = response.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) {
      throw new AppError(502, "Hugging Face returned an empty response. Please try again.");
    }

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
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error(`[HuggingFace Service Error] Model: ${model}`, err);

    const msg: string = err?.message || String(err);

    if (msg.includes("401") || msg.includes("token") || msg.includes("Unauthorized")) {
      throw new AppError(
        401,
        "Invalid or unauthorized HF_TOKEN. Please verify your token permissions on Hugging Face."
      );
    }

    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Too Many Requests")) {
      throw new AppError(429, "Hugging Face rate limit reached. Please wait a moment and try again.");
    }

    if (msg.includes("503") || msg.includes("loading") || msg.includes("Model is currently loading")) {
      throw new AppError(
        503,
        "The requested model is currently loading on Hugging Face. Please retry in 20-30 seconds."
      );
    }

    throw new AppError(502, `Hugging Face inference error: ${msg}`);
  }
}

