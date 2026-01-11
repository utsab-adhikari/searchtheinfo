import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { ICodeBlock } from './codeBlocks';
import { ICitationBlock } from './citationModel';
import { IImage } from './imageModel';

export interface IBlock extends Document {
  type: 'text' | 'code' | 'citation';
  codeBlock?: Types.ObjectId | ICodeBlock;
  citationBlock?: Types.ObjectId | ICitationBlock;
  image?: Types.ObjectId | IImage;
  level?: number;
  content?: string;
}

const BlockSchema = new Schema<IBlock>({
  type: { type: String, enum: ['text', 'code', 'citation', "heading", "image"], required: true },
  level: { type: Number }, 
  content: { type: String }, 

  codeBlock: { type: Schema.Types.ObjectId, ref: 'CodeBlock' }, 
  citationBlock: { type: Schema.Types.ObjectId, ref: 'CitationBlock' },
  image: { type: Schema.Types.ObjectId, ref: "Image" },
});

export default mongoose.models.Block || model<IBlock>('Block', BlockSchema);
