import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityRole = "guest" | "editor" | "admin";
export type ActivityAction = "view" | "create" | "update" | "delete";

export interface ActivityLogDocument extends Document {
  userId?: string | null;
  role: ActivityRole;
  action: ActivityAction;
  route: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: String, required: false, index: true },
    role: { type: String, enum: ["guest", "editor", "admin"], required: true, index: true },
    action: { type: String, enum: ["view", "create", "update", "delete"], required: true, index: true },
    route: { type: String, required: true, index: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ createdAt: 1 });
ActivityLogSchema.index({ route: 1, createdAt: -1 });

const ActivityLog: Model<ActivityLogDocument> =
  mongoose.models.ActivityLog ||
  mongoose.model<ActivityLogDocument>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
