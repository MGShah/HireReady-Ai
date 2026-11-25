import mongoose, { Schema, Document } from "mongoose";

export interface ISkillAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  target_role: string;
  job_description: string | null;
  result: {
    skills: Array<{
      skill: string;
      status: "demonstrated" | "partial" | "unverified";
      evidence: string;
      required_level: string;
    }>;
  };
  demo: boolean;
  created_at: Date;
}

const SkillAnalysisSchema = new Schema<ISkillAnalysis>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    target_role: {
      type: String,
      required: true,
    },
    job_description: {
      type: String,
      default: null,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    demo: {
      type: Boolean,
      default: false,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "skillAnalyses",
  }
);

export const SkillAnalysis = mongoose.model<ISkillAnalysis>(
  "SkillAnalysis",
  SkillAnalysisSchema
);
