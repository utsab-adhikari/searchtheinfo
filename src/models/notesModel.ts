import mongoose, { Schema, Document, model, Types } from 'mongoose';

export interface INote extends Document {
  article: Types.ObjectId;
  title: string;
  content: string;
}

const NoteSchema = new Schema<INote>({
  article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
});

export default mongoose.models.Note || model<INote>('Note', NoteSchema);
