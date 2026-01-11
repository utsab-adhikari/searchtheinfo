import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface IScratchPad extends Document {
  article: Types.ObjectId;
  text: string;
}

const ScratchPadSchema = new Schema<IScratchPad>({
  article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  text: { type: String },
});

export default mongoose.models.ScratchPad || model<IScratchPad>('ScratchPad', ScratchPadSchema);
