import mongoose, { Schema, Document, model } from 'mongoose';

export interface ICodeBlock extends Document {
  language: string;
  code: string;
  output?: string;
  description?: string;
}

const CodeBlockSchema = new Schema<ICodeBlock>({
  language: { type: String, required: true },
  code: { type: String, required: true },
  output: { type: String },
  description: { type: String },
});

export default mongoose.models.CodeBlock || model<ICodeBlock>('CodeBlock', CodeBlockSchema);





