import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface IView extends Document {
  ip: string;
  count: number;
  article: Types.ObjectId;
}

const ViewSchema = new Schema<IView>({
  ip: { type: String, required: true },
  count: { type: Number, default: 1 },
  article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
});

export default mongoose.models.View || model<IView>('View', ViewSchema);
