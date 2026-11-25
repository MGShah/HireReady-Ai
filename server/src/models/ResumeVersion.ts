import mongoose, { Schema, Document } from "mongoose";

export interface ITypographySettings {
  font_family: "Inter" | "Roboto" | "Merriweather" | "JetBrains Mono" | "Lato";
  font_size: "small" | "regular" | "large";
  accent_color: string;
  page_margins: "compact" | "normal" | "spacious";
  bullet_style: "disc" | "dash" | "arrow" | "square";
  layout_mode: "one_page" | "multi_page";
}

export interface IAtsChecklist {
  keyword_coverage: {
    matched: string[];
    missing: string[];
    coverage_percent: number;
  };
  heading_structure: {
    valid: boolean;
    notes: string[];
  };
  date_consistency: {
    valid: boolean;
    notes: string[];
  };
  readability: {
    score: number;
    notes: string[];
  };
  layout_compatibility: {
    ats_safe: boolean;
    recommendations: string[];
  };
  overall_readiness: "Excellent" | "Good" | "Needs Improvement";
}

export interface IResumeVersion extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  userId?: string;
  source_resume_id?: string;
  version_name: string;
  target_role: string;
  target_company: string;
  industry: string;
  company_style: "big_tech" | "enterprise" | "startup" | "academic";
  original_content: any;
  tailored_content: any;
  template_type: "classic" | "modern" | "minimal" | "executive" | "academic";
  typography_settings: ITypographySettings;
  section_order: string[];
  section_visibility: Record<string, boolean>;
  ats_checklist: IAtsChecklist;
  generation_metadata: {
    tailoring_model: string;
    prompt_version: string;
    generated_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}

const ResumeVersionSchema = new Schema<IResumeVersion>(
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
    source_resume_id: {
      type: String,
      default: null,
    },
    version_name: {
      type: String,
      required: true,
    },
    target_role: {
      type: String,
      required: true,
    },
    target_company: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    company_style: {
      type: String,
      enum: ["big_tech", "enterprise", "startup", "academic"],
      default: "big_tech",
    },
    original_content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    tailored_content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    template_type: {
      type: String,
      enum: ["classic", "modern", "minimal", "executive", "academic"],
      default: "modern",
    },
    typography_settings: {
      type: Schema.Types.Mixed,
      default: {
        font_family: "Inter",
        font_size: "regular",
        accent_color: "#4f46e5",
        page_margins: "normal",
        bullet_style: "disc",
        layout_mode: "multi_page",
      },
    },
    section_order: {
      type: [String],
      default: [
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
      ],
    },
    section_visibility: {
      type: Schema.Types.Mixed,
      default: {
        summary: true,
        experience: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
        custom: false,
      },
    },
    ats_checklist: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generation_metadata: {
      type: Schema.Types.Mixed,
      default: () => ({
        tailoring_model: "groq/openai/gpt-oss-20b",
        prompt_version: "1.0",
        generated_at: new Date(),
      }),
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
    collection: "resume_versions",
  }
);

ResumeVersionSchema.index({ user_id: 1, created_at: -1 });

export const ResumeVersion = mongoose.model<IResumeVersion>(
  "ResumeVersion",
  ResumeVersionSchema
);
