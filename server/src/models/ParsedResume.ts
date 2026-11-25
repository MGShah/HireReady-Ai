import mongoose, { Schema, Document } from "mongoose";

export interface IParsedWorkExperience {
  company: string;
  position: string;
  dates: string;
  responsibilities: string[];
  achievements: string[];
}

export interface IParsedEducation {
  institution: string;
  degree: string;
  graduation_year: string;
  details?: string;
}

export interface IParsedProject {
  name: string;
  description: string;
  technologies: string[];
  measurable_outcomes?: string;
  link?: string;
}

export interface IParsedCertification {
  name: string;
  issuer: string;
  date: string;
}

export interface IParsedStructuredData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  hard_skills: string[];
  soft_skills: string[];
  experience: IParsedWorkExperience[];
  education: IParsedEducation[];
  projects: IParsedProject[];
  certifications: IParsedCertification[];
  domain_specializations: string[];
  languages: string[];
  accomplishments: string[];
}

export interface IParsedResume extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  userId?: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_reference: string;
  extracted_text: string;
  structured_data: IParsedStructuredData;
  parser_version: string;
  parsing_status: "pending" | "completed" | "failed";
  is_scanned_pdf: boolean;
  extraction_errors: string[];
  created_at: Date;
  updated_at: Date;
}

const ParsedResumeSchema = new Schema<IParsedResume>(
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
    original_filename: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    storage_reference: {
      type: String,
      required: true,
    },
    extracted_text: {
      type: String,
      default: "",
    },
    structured_data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    parser_version: {
      type: String,
      default: "1.0.0",
    },
    parsing_status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    is_scanned_pdf: {
      type: Boolean,
      default: false,
    },
    extraction_errors: {
      type: [String],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "parsed_resumes",
  }
);

ParsedResumeSchema.index({ user_id: 1, created_at: -1 });

export const ParsedResume = mongoose.model<IParsedResume>(
  "ParsedResume",
  ParsedResumeSchema
);
