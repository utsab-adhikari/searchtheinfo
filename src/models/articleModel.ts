import mongoose, { Schema, Document, model, Types } from 'mongoose';
import { IImage } from './imageModel';
import { IResource } from './resourceModel';
import { ICategory } from './categoryModel';

export interface ICitation {
  _id?: Types.ObjectId;
  text: string;
  url?: string;
  authors?: string[];
  publisher?: string;
  publishDate?: Date;
  accessedDate?: Date;
  note?: string;
}

export interface IBlockEmbedded {
  _id?: string;
  type: string;
  content?: string;
  level?: number;
  image?: any;
  caption?: string;
  code?: string;
  language?: string;
  citation?: any;
  items?: string[];
  note?: string;
}

export interface IArticle extends Document {
  title: string;
  category: Types.ObjectId | ICategory;
  excerpt?: string;
  slug: string;
  tags?: string[];
  featuredImage?: Types.ObjectId | IImage;
  blocks?: IBlockEmbedded[];
  resources?: Types.ObjectId | IResource;
  images?: Types.ObjectId[] | IImage[];
  notes?: any[];
  citations?: ICitation[];
  researchedBy?: Types.ObjectId;
  publishedBy?: Types.ObjectId;
  publishedAt?: Date;
  status: 'draft' | 'review' | 'published';
  readingTime?: number;
  wordCount?: number;
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  excerpt: { type: String },
  slug: { type: String, required: true, unique: true },
  tags: [{ type: String }],
  featuredImage: { type: Schema.Types.ObjectId, ref: 'Image' },
  blocks: [{
    _id: false,
    type: { type: String },
    content: { type: String },
    level: { type: Number },
    image: { type: Schema.Types.Mixed },
    caption: { type: String },
    code: { type: String },
    language: { type: String },
    citation: { type: Schema.Types.Mixed },
    items: [{ type: String }],
    note: { type: String },
  }],
  resources: { type: Schema.Types.ObjectId, ref: 'Resource' },
  images: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
  notes: [{
    _id: false,
    title: { type: String },
    content: { type: String },
    tags: [{ type: String }],
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }],
  citations: [{
    _id: false,
    text: { type: String, required: true },
    url: { type: String },
    authors: [{ type: String }],
    publisher: { type: String },
    publishDate: { type: Date },
    accessedDate: { type: Date },
    note: { type: String },
  }],
  researchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
  status: { type: String, enum: ['draft', 'review', 'published'], default: 'draft' },
  readingTime: { type: Number },
  wordCount: { type: Number },
}, { timestamps: true });

export default mongoose.models.Article || model<IArticle>('Article', ArticleSchema);
