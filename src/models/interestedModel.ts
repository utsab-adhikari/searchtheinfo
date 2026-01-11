import mongoose, { Schema, Document, model, Types } from "mongoose";

interface IInterested extends Document {
  name: string;
  email?: string;
  type?: string;
  description?: string;
  timeline?: string;
  budget?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InterestedSchema = new Schema<IInterested>(
  {
    name: { type: String, required: true },
    email: { type: String },
    type: { type: String },
    timeline: { type: String },
    budget: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const InterestedModel = model<IInterested>("Interested", InterestedSchema);
export default InterestedModel;
