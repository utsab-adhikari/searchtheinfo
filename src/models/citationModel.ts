import mongoose, { Schema, Document, model } from 'mongoose';

export interface ICitationBlock extends Document {
  text: string;
  url?: string;
  authors?: string[];
  description?: string;
  number?: number;
  publisher?: string;
  publishedDate?: Date;
}

const CitationBlockSchema = new Schema<ICitationBlock>({
  text: { type: String, required: true },
  url: { type: String },
  authors: { type: [String] },
  description: { type: String },
  number: { type: Number },
  publisher: { type: String },
  publishedDate: { type: Date },
});

export default mongoose.models.CitationBlock || model<ICitationBlock>('CitationBlock', CitationBlockSchema);
