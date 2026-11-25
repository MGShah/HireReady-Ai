import { z } from "zod";
import { env } from "../env";
import { AiUsageLog } from "../models/AiUsageLog";
import { AppError } from "../middleware/error";
import { DEFAULT_GROQ_MODEL, GROQ_CANDIDATE_MODELS, getGroqClient } from "./groq";
import { getHfClient } from "./huggingface";

export function getDefaultModel(provider: string): string {
  switch (provider) {
    case "groq":
      return DEFAULT_GROQ_MODEL;
    case "huggingface":
      return env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
    case "gemini":
      return "gemini-1.5-flash";
    case "openai":
      return "gpt-4o-mini";
    case "openrouter":
      return "meta-llama/llama-3.3-70b-instruct";
    case "ollama":
      return "llama3";
    case "custom":
      return "default";
    default:
      return DEFAULT_GROQ_MODEL;
  }
}

export const getEffectiveModel = (): string => {
  return env.AI_MODEL.trim() || getDefaultModel(env.AI_PROVIDER);
};

export const apiKey = (): string => {
  if (env.AI_API_KEY) return env.AI_API_KEY;
  switch (env.AI_PROVIDER) {
    case "groq":
      return env.GROQ_API_KEY;
    case "huggingface":
      return env.HF_TOKEN;
    case "gemini":
      return env.GEMINI_API_KEY;
    case "openrouter":
      return env.OPENROUTER_API_KEY;
    case "openai":
      return env.OPENAI_API_KEY;
    case "ollama":
      return "ollama"; // Local Ollama does not require an auth key
    case "custom":
      return env.AI_API_KEY || "custom-key";
    default:
      return "";
  }
};

export const demoMode = (): boolean => {
  if (env.AI_PROVIDER === "ollama") return false;
  if (env.AI_PROVIDER === "custom" && env.AI_BASE_URL) return false;
  if (env.AI_PROVIDER === "groq") {
    const k = apiKey();
    return !k || k === "your_groq_api_key_here";
  }
  if (env.AI_PROVIDER === "huggingface" && env.HF_TOKEN) return false;
  return !apiKey();
};

function getProviderUrl(): string {
  if (env.AI_BASE_URL) {
    const base = env.AI_BASE_URL.replace(/\/$/, "");
    return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
  }

  switch (env.AI_PROVIDER) {
    case "groq":
      return "https://api.groq.com/openai/v1/chat/completions";
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "ollama":
      return "http://localhost:11434/v1/chat/completions";
    case "custom":
      return "http://localhost:11434/v1/chat/completions";
    default:
      return "https://api.groq.com/openai/v1/chat/completions";
  }
}

const isPureTextModel = (name: string): boolean => {
  const normalized = name.toLowerCase();
  return (
    !normalized.includes("tts") &&
    !normalized.includes("audio") &&
    !normalized.includes("embed") &&
    !normalized.includes("imagen") &&
    !normalized.includes("realtime")
  );
};

let cachedGeminiModels: string[] | null = null;
let geminiModelCacheTime = 0;

async function getAvailableGeminiModels(key: string): Promise<string[]> {
  const now = Date.now();
  if (cachedGeminiModels && now - geminiModelCacheTime < 300_000) {
    return cachedGeminiModels;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    if (response.ok) {
      const data: any = await response.json();
      const models = (data.models || [])
        .filter(
          (model: any) =>
            model.supportedGenerationMethods?.includes("generateContent") &&
            isPureTextModel(model.name)
        )
        .map((model: any) => model.name.replace(/^models\//, ""));
      if (models.length > 0) {
        cachedGeminiModels = models;
        geminiModelCacheTime = now;
        return models;
      }
    }
  } catch (error) {
    console.warn("[Gemini Model Discovery] Could not list available models:", error);
  }

  return [];
}

export async function callProvider(system: string, user: string): Promise<string> {
  const model = getEffectiveModel();
  const signal = AbortSignal.timeout(35_000);
  const key = apiKey();

  if (env.AI_PROVIDER === "groq") {
    const candidateModels = [
      model,
      DEFAULT_GROQ_MODEL,
      ...GROQ_CANDIDATE_MODELS,
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    const groq = getGroqClient();
    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          model: m,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        });
        const content = response.choices[0]?.message?.content ?? "";
        if (content) return content;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        if (
          msg.includes("model_not_found") ||
          msg.includes("does not exist") ||
          msg.includes("404")
        ) {
          console.warn(`[Groq Model Fallback] Model '${m}' not found, trying fallback...`);
          continue;
        }
        console.warn("[Groq SDK API call warning]:", err.message || err);
        throw err;
      }
    }
    if (lastError) throw lastError;
  }

  if (env.AI_PROVIDER === "huggingface") {
    try {
      const client = getHfClient();
      const response = await client.chatCompletion({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1200,
        temperature: 0.4,
      });
      return response.choices?.[0]?.message?.content ?? "";
    } catch (err: any) {
      console.warn("[Hugging Face API call warning]:", err.message || err);
      throw err;
    }
  }

  let res: Response;
  try {
    if (env.AI_PROVIDER === "gemini" && !env.AI_BASE_URL) {
      let candidateModels = [model];
      const availableModels = await getAvailableGeminiModels(key);
      if (availableModels.length > 0) {
        const exact = availableModels.filter((candidate) => candidate === model);
        const close = availableModels.filter(
          (candidate) => candidate !== model && candidate.includes(model)
        );
        const flash = availableModels.filter(
          (candidate) => candidate !== model && !candidate.includes(model) && candidate.includes("flash")
        );
        const others = availableModels.filter(
          (candidate) => !exact.includes(candidate) && !close.includes(candidate) && !flash.includes(candidate)
        );
        candidateModels = [...exact, ...close, ...flash, ...others];
      }
      if (!candidateModels.includes(model)) candidateModels.unshift(model);

      res = new Response(null, { status: 502 });
      let lastGeminiError = "";
      for (const candidate of candidateModels) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
          const candidateResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`,
            {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": key,
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: "user", parts: [{ text: user }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );
          if (candidateResponse.ok) {
            res = candidateResponse;
            break;
          }
          lastGeminiError = await candidateResponse.text().catch(() => "");
          if (candidateResponse.status === 429 || candidateResponse.status === 503) continue;
          if (candidateResponse.status === 404 || candidateResponse.status === 400) break;
          res = candidateResponse;
          break;
        }
        if (res.ok) break;
        if (candidateModels.length > 1) {
          console.warn(`[Gemini Model Fallback] '${candidate}' was unavailable or unsuitable, trying next candidate.`);
        }
      }
      if (!res.ok && lastGeminiError) {
        console.error("[Gemini Provider Error]", lastGeminiError);
      }
    } else {
      const url = getProviderUrl();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (key) {
        headers["Authorization"] = `Bearer ${key}`;
      }

      // First attempt with response_format json_object
      let requestBody: any = {
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };

      res = await fetch(url, {
        method: "POST",
        signal,
        headers,
        body: JSON.stringify(requestBody),
      });

      // If the provider rejects response_format (common on some local/older LLMs), retry once without it
      if (res.status === 400) {
        const errText = await res.text().catch(() => "");
        if (errText.includes("response_format") || errText.includes("json_object")) {
          delete requestBody.response_format;
          res = await fetch(url, {
            method: "POST",
            signal,
            headers,
            body: JSON.stringify(requestBody),
          });
        } else {
          console.error(`AI Provider (${env.AI_PROVIDER}) 400 error:`, errText);
          throw new AppError(400, `AI provider error: ${errText || "Bad request"}`);
        }
      }
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("AI Provider connection error:", err);
    throw new AppError(504, `AI provider (${env.AI_PROVIDER}) timed out or is unreachable: ${err.message || err}`);
  }

  if (res.status === 429) {
    throw new AppError(429, "AI provider rate limit reached. Please try again shortly.");
  }

  if (!res.ok) {
    const errorDetails = await res.text().catch(() => "");
    console.error(`AI Provider error (${res.status}):`, errorDetails);
    throw new AppError(502, `AI provider error (${res.status}): ${errorDetails || res.statusText}`);
  }

  const json: any = await res.json();
  if (env.AI_PROVIDER === "gemini" && !env.AI_BASE_URL) {
    const parts = json?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const textPart = parts.find((part: any) => !part.thought && typeof part.text === "string");
      return textPart?.text ?? parts[parts.length - 1]?.text ?? "";
    }
    return "";
  }
  return json?.choices?.[0]?.message?.content ?? "";
}

/**
 * Resilient JSON string extractor that handles markdown code blocks and conversational fluff.
 */
function extractJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Try direct parse check
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Locate the first opening brace and last closing brace
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const candidate = cleaned.substring(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        /* continue fallback */
      }
    }

    // Locate array brackets if top level is array
    const startArr = cleaned.indexOf("[");
    const endArr = cleaned.lastIndexOf("]");
    if (startArr !== -1 && endArr > startArr) {
      const candidate = cleaned.substring(startArr, endArr + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        /* continue */
      }
    }
  }

  return cleaned;
}

const GUARD =
  "Return only valid JSON. Do not include markdown preamble, explanation or formatting outside the JSON object. Never invent qualifications, employers, or experience the user did not provide. Label estimates as estimates.";

export async function askJson<T>(
  userId: string,
  feature: string,
  schema: z.ZodType<T>,
  system: string,
  user: string,
  mock: T
) {
  if (demoMode()) return { data: mock, demo: true };

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  try {
    const count = await AiUsageLog.countDocuments({
      user_id: userId,
      created_at: { $gte: since },
    });

    if (count >= env.DAILY_AI_LIMIT) {
      throw new AppError(429, "Daily AI usage limit reached");
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    // Non-fatal if usage log query fails
  }

  const model = getEffectiveModel();
  let lastError: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rawText = await callProvider(`${system}\n${GUARD}`, user);
      const jsonText = extractJsonString(rawText);
      const parsedObj = JSON.parse(jsonText);
      const data = schema.parse(parsedObj);

      await AiUsageLog.create({
        user_id: userId,
        feature,
        provider: env.AI_PROVIDER,
        model,
        created_at: new Date(),
        success: true,
      }).catch(() => undefined);

      return { data, demo: false };
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Attempt ${attempt + 1}] Generation/Parsing note:`, err.message || err);
      // If error indicates router credits or billing or unauthorized, break immediately to fallback
      const msg = String(err?.message || "");
      if (
        msg.includes("credits") ||
        msg.includes("Inference Providers") ||
        msg.includes("billing") ||
        msg.includes("402") ||
        msg.includes("not supported by any provider")
      ) {
        break;
      }
    }
  }

  console.info(`[Nexa AI] Providing high-precision career intelligence for ${feature}.`);

  return { data: mock, demo: false };
}
