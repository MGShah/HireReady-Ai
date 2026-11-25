import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  company: string;
  title: string;
  url: string | null;
  status:
    | "saved"
    | "applied"
    | "assessment"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "saved",
        "applied",
        "assessment",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      default: "saved",
      required: true,
    },
    notes: {
      type: String,
      default: null,
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
    collection: "applications",
  }
);

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);
