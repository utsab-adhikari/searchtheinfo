import mongoose, { Schema, Document, model } from 'mongoose';

export interface IResourceSite {
  name: string;
  url: string;
  note?: string;
}

export interface IResourceBook {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  note?: string;
}

export interface IResourceVideo {
  title: string;
  url: string;
  channel: string;
  uploadedDate?: string;
  note?: string;
}

export interface IResource extends Document {
  article?: mongoose.Types.ObjectId;
  daysToComplete?: number;
  lastReviewed?: string;
  books?: IResourceBook[];
  sites?: IResourceSite[];
  youtubeVideos?: IResourceVideo[];
}

const ResourceSchema = new Schema<IResource>({
  article: { type: Schema.Types.ObjectId, ref: 'Article' },
  daysToComplete: { type: Number, default: 1 },
  lastReviewed: { type: String },
  books: [{
    _id: false,
    title: { type: String },
    author: { type: String },
    publisher: { type: String },
    publishedDate: { type: String },
    note: { type: String },
  }],
  sites: [{
    _id: false,
    name: { type: String },
    url: { type: String },
    note: { type: String },
  }],
  youtubeVideos: [{
    _id: false,
    title: { type: String },
    url: { type: String },
    channel: { type: String },
    uploadedDate: { type: String },
    note: { type: String },
  }],
}, { timestamps: true });

export default mongoose.models.Resource || model<IResource>('Resource', ResourceSchema);
