import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  userId?: string;
  role: "user" | "admin";
  full_name: string | null;
  education: string | null;
  college: string | null;
  graduation_year: number | null;
  skills: string[];
  target_role: string | null;
  location: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  portfolio: string | null;
  summary: string | null;
  domain_specializations: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: string[];
  accomplishments: string[];
  profile_completion_percentage: number;
  daily_minutes: number;
  created_at: Date;
  updated_at: Date;
}

const ProfileSchema = new Schema<IProfile>(
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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    full_name: {
      type: String,
      default: null,
    },
    education: {
      type: String,
      default: null,
    },
    college: {
      type: String,
      default: null,
    },
    graduation_year: {
      type: Number,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
      required: true,
    },
    target_role: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    linkedin: {
      type: String,
      default: null,
    },
    github: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    portfolio: {
      type: String,
      default: null,
    },
    summary: {
      type: String,
      default: null,
    },
    domain_specializations: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [
        {
          name: { type: String, default: "" },
          issuer: { type: String, default: "" },
          date: { type: String, default: "" },
        },
      ],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    accomplishments: {
      type: [String],
      default: [],
    },
    profile_completion_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    daily_minutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 480,
      required: true,
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
    collection: "profiles",
  }
);

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);

