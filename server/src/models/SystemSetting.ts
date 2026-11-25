import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  updated_at: Date;
  updated_by?: string | null;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    updated_by: {
      type: String,
      default: null,
    },
  },
  {
    collection: "systemSettings",
  }
);

export const SystemSetting = mongoose.model<ISystemSetting>(
  "SystemSetting",
  SystemSettingSchema
);
