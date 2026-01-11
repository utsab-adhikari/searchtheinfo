import mongoose, { Schema, Document, model } from 'mongoose';

export interface IImage extends Document {
  url: string;
  title: string;
  description?: string;
  caption?: string;
  attribution?: string;
  uploadedAt: Date;
}

const ImageSchema = new Schema<IImage>({
  url: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  caption: { type: String },
  attribution: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Image || model<IImage>('Image', ImageSchema);
