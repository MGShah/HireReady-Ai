import mongoose, { Schema, Document } from "mongoose";

export interface ITransferableSkill {
  skill: string;
  relevance: string;
  transfer_context: string;
}

export interface IMissingSkill {
  skill: string;
  priority: "critical" | "recommended" | "nice-to-have";
  reason: string;
}

export interface IImprovementPlanStep {
  phase: string;
  topic: string;
  actions: string[];
  resources: string[];
}

export interface IRecommendedRole {
  role: string;
  explanation: string;
  match_score: number;
}

export interface IScoreBreakdown {
  skill_score: number;
  experience_score: number;
  domain_score: number;
  weights: {
    skills: number;
    experience: number;
    domain: number;
  };
}

export interface IJobTarget extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  userId?: string;
  target_role: string;
  company?: string;
  industry?: string;
  job_description?: string;
  required_skills: string[];
  fit_score: number;
  fit_category: "Strong Fit" | "Moderate Fit" | "Partial Fit" | "Significant Gap";
  score_breakdown: IScoreBreakdown;
  matched_skills: string[];
  transferable_skills: ITransferableSkill[];
  missing_skills: IMissingSkill[];
  experience_alignment: string;
  strengths: string[];
  improvement_plan: IImprovementPlanStep[];
  recommended_roles: IRecommendedRole[];
  career_advice: string;
  confidence: "high" | "medium" | "low";
  evaluation_version: string;
  created_at: Date;
}

const JobTargetSchema = new Schema<IJobTarget>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: function (this: any) {
        return this.user_id;
      },
    },
    target_role: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    job_description: {
      type: String,
      default: "",
    },
    required_skills: {
      type: [String],
      default: [],
    },
    fit_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    fit_category: {
      type: String,
      enum: ["Strong Fit", "Moderate Fit", "Partial Fit", "Significant Gap"],
      required: true,
    },
    score_breakdown: {
      type: Schema.Types.Mixed,
      required: true,
    },
    matched_skills: {
      type: [String],
      default: [],
    },
    transferable_skills: {
      type: [
        {
          skill: { type: String, required: true },
          relevance: { type: String, default: "" },
          transfer_context: { type: String, default: "" },
        },
      ],
      default: [],
    },
    missing_skills: {
      type: [
        {
          skill: { type: String, required: true },
          priority: {
            type: String,
            enum: ["critical", "recommended", "nice-to-have"],
            default: "recommended",
          },
          reason: { type: String, default: "" },
        },
      ],
      default: [],
    },
    experience_alignment: {
      type: String,
      default: "",
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvement_plan: {
      type: [
        {
          phase: { type: String, required: true },
          topic: { type: String, required: true },
          actions: { type: [String], default: [] },
          resources: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    recommended_roles: {
      type: [
        {
          role: { type: String, required: true },
          explanation: { type: String, default: "" },
          match_score: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    career_advice: {
      type: String,
      default: "",
    },
    confidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "high",
    },
    evaluation_version: {
      type: String,
      default: "1.0.0",
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "job_targets",
  }
);

JobTargetSchema.index({ user_id: 1, created_at: -1 });

export const JobTarget = mongoose.model<IJobTarget>(
  "JobTarget",
  JobTargetSchema
);
