import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewMessage {
  role: "assistant" | "user";
  content: string;
  feedback?: {
    correctness: number;
    relevance: number;
    clarity: number;
    missing: string[];
    example: string;
  } | null;
  created_at: Date;
}

export interface IInterviewSession extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  role: string;
  type: "technical" | "coding" | "project";
  difficulty: "easy" | "medium" | "hard";
  question_count: number;
  status: "active" | "completed";
  demo: boolean;
  messages: IInterviewMessage[];
  created_at: Date;
}

const InterviewMessageSchema = new Schema<IInterviewMessage>(
  {
    role: {
      type: String,
      enum: ["assistant", "user"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    feedback: {
      type: Schema.Types.Mixed,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["technical", "coding", "project"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    question_count: {
      type: Number,
      min: 1,
      max: 15,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
    },
    demo: {
      type: Boolean,
      default: false,
      required: true,
    },
    messages: {
      type: [InterviewMessageSchema],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "interviewSessions",
  }
);

export const InterviewSession = mongoose.model<IInterviewSession>(
  "InterviewSession",
  InterviewSessionSchema
);
