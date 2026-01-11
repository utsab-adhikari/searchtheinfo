import mongoose, { Schema, Document, model } from "mongoose";

export interface ICategory extends Document {
  title: string;
  description?: string;
  createdBy?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Category ||
  model<ICategory>("Category", CategorySchema);
