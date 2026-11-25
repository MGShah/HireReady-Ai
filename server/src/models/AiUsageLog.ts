import mongoose, { Schema } from "mongoose";

export interface IAiUsageLog {
  _id?: mongoose.Types.ObjectId;
  user_id: string;
  feature: string;
  provider: "groq" | "gemini" | "openrouter" | "openai" | "ollama" | "custom" | string;
  model: string;
  created_at: Date;
  request_tokens?: number | null;
  response_tokens?: number | null;
  latency_ms?: number | null;
  success?: boolean | null;
  error_message?: string | null;
}

const AiUsageLogSchema = new Schema<IAiUsageLog>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    request_tokens: {
      type: Number,
      default: null,
    },
    response_tokens: {
      type: Number,
      default: null,
    },
    latency_ms: {
      type: Number,
      default: null,
    },
    success: {
      type: Boolean,
      default: true,
    },
    error_message: {
      type: String,
      default: null,
    },
  },
  {
    collection: "aiUsageLogs",
  }
);

export const AiUsageLog = mongoose.model<IAiUsageLog>(
  "AiUsageLog",
  AiUsageLogSchema
);
