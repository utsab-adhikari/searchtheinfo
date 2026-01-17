import mongoose, { Schema, Document, Model } from "mongoose";

export type MetricType = "frontend" | "api" | "db";

export interface MetricDocument extends Document {
  type: MetricType;
  name: string; // route or operation name
  duration?: number; // milliseconds
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const MetricSchema = new Schema<MetricDocument>(
  {
    type: { type: String, enum: ["frontend", "api", "db"], required: true, index: true },
    name: { type: String, required: true, index: true },
    duration: { type: Number },
    status: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MetricSchema.index({ createdAt: 1 });
MetricSchema.index({ type: 1, name: 1, createdAt: -1 });

const Metric: Model<MetricDocument> =
  mongoose.models.Metric || mongoose.model<MetricDocument>("Metric", MetricSchema);

export default Metric;
