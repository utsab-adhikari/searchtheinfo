import mongoose, { Document, Model, model, Schema } from "mongoose";

export interface IInterested extends Document {
  name: string;
  email: string;
  type: string;
  description: string;
  timeline: string;
  budget: string;
  createdAt: Date;
}

const InterestedSchema: Schema = new Schema<IInterested>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    timeline: { type: String, required: true },
    budget: { type: String, required: true },
  },
  { timestamps: true }
);

export const InterestedModel: Model<IInterested> =
  mongoose.models.Interested ||
  model<IInterested>("Interested", InterestedSchema);

export default InterestedModel;
