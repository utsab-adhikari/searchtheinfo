import mongoose, { Schema, Types, Document } from "mongoose";

export interface IAuthor {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

export interface IReference {
  title: string;
  authors?: string;
  publisher?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
  accessedAt?: Date;
}

export interface IResource {
  type: "book" | "website" | "youtube" | "paper" | "course" | "other";
  title: string;
  author?: string;
  url?: string;
  description?: string;
}

export interface IContentBlock {
  type: "text" | "image" | "list" | "quote" | "code" | "equation";
  text?: string;
  image?: {
    url: string;
    caption?: string;
    credit?: string;
    // New optional Cloudinary metadata for lifecycle + optimization
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  listItems?: string[];
  quoteAuthor?: string;
  codeLanguage?: string;
  citations?: Types.ObjectId[];
}

export interface ISection {
  title: string;
  type:
    | "introduction"
    | "literature"
    | "methodology"
    | "results"
    | "discussion"
    | "conclusion"
    | "custom";
  order: number;
  blocks: IContentBlock[];
}

export interface IRevision {
  editedBy: Types.ObjectId;
  editedAt: Date;
  summary?: string;
}

export interface IArticle extends Document {
  title: string;
  slug: string;
  abstract: string;
  keywords: string[];
  category: Types.ObjectId;

  authors: IAuthor[];

  sections: ISection[];

  references: IReference[];
  resources: IResource[];

  scratchPad: string;
  notes: string;

  status: "draft" | "in-review" | "published" | "archived";

  createdBy: Types.ObjectId;
  revisions: IRevision[];

  persistentId?: string;

  views: number;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema = new Schema<IAuthor>(
  {
    name: { type: String, required: true },
    affiliation: String,
    email: String,
    orcid: String,
  },
  { _id: false }
);

const ReferenceSchema = new Schema<IReference>(
  {
    title: { type: String, required: true },
    authors: String,
    publisher: String,
    year: Number,
    journal: String,
    doi: String,
    url: String,
    accessedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ResourceSchema = new Schema<IResource>(
  {
    type: {
      type: String,
      enum: ["book", "website", "youtube", "paper", "course", "other"],
      required: true,
    },
    title: { type: String, required: true },
    author: String,
    url: String,
    description: String,
  },
  { _id: true }
);

const ContentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: ["text", "image", "list", "quote", "code", "equation"],
      required: true,
    },
    text: String,
    image: {
      url: String,
      caption: String,
      credit: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },
    listItems: [String],
    quoteAuthor: String,
    codeLanguage: String,
    citations: [{ type: Schema.Types.ObjectId }],
  },
  { _id: true }
);

const SectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "introduction",
        "literature",
        "methodology",
        "results",
        "discussion",
        "conclusion",
        "custom",
      ],
      default: "custom",
    },
    order: { type: Number, default: 0 },
    blocks: [ContentBlockSchema],
  },
  { _id: true }
);

const RevisionSchema = new Schema<IRevision>(
  {
    editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: Date.now },
    summary: String,
  },
  { _id: true }
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    abstract: { type: String, required: true },
    keywords: [{ type: String, index: true }],

    authors: [AuthorSchema],

    sections: [SectionSchema],

    references: [ReferenceSchema],
    resources: [ResourceSchema],

    scratchPad: { type: String, default: "" },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "in-review", "published", "archived"],
      default: "draft",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    revisions: [RevisionSchema],

    persistentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Article =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema, "articles");

export default Article;