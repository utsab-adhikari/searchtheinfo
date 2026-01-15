import mongoose, { Schema, Document, Model } from "mongoose";

export type MetricType = "webvital" | "navigation" | "api" | "db";

export interface MetricDoc extends Document {
  type: MetricType;
  name: string;
  duration?: number;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const MetricSchema = new Schema<MetricDoc>(
  {
    type: { type: String, enum: ["webvital", "navigation", "api", "db"], required: true },
    name: { type: String, required: true },
    duration: { type: Number },
    path: { type: String },
    method: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Metric: Model<MetricDoc> = mongoose.models.Metric || mongoose.model<MetricDoc>("Metric", MetricSchema);

export default Metric;
