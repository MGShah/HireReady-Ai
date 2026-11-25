import mongoose, { Schema, Document } from "mongoose";

export interface IResumeContent {
  template: "classic" | "modern" | "minimal";
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  skills: string;
  achievements: string;
  languages: string;
  customTitle: string;
  customContent: string;
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    details: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    dates: string;
  }>;
  projects: Array<{
    name: string;
    link: string;
    details: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  userId?: string;
  content: IResumeContent;
  created_at: Date;
  updated_at: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      default: function (this: any) {
        return this.user_id;
      },
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "resumes",
  }
);

export const Resume = mongoose.model<IResume>("Resume", ResumeSchema);
