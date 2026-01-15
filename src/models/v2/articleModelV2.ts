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
  volume?: string;
  issue?: string;
  pages?: string;
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

export interface ILink {
  text: string; // visible text
  url: string; // hyperlink URL
}

export interface IContentBlock {
  type: "text" | "image" | "list" | "quote" | "code" | "equation";
  text?: string;
  links?: ILink[]; // array of links within text

  image?: {
    url: string;
    caption?: string;
    credit?: string;
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

  citations?: Types.ObjectId[];

  children?: ISection[];
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

  references: Types.ObjectId[];
  resources: IResource[];

  scratchPad?: string;
  notes?: string;

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
    name: { type: String, required: true, trim: true },
    affiliation: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    orcid: { type: String, trim: true },
  },
  { _id: false }
);

const ReferenceSchema = new Schema<IReference>(
  {
    title: { type: String, required: true, trim: true },
    authors: { type: String, trim: true },
    publisher: { type: String, trim: true },
    year: Number,
    journal: String,
    volume: String,
    issue: String,
    pages: String,
    doi: { type: String, trim: true },
    url: { type: String, trim: true },
    accessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ResourceSchema = new Schema<IResource>(
  {
    type: {
      type: String,
      enum: ["book", "website", "youtube", "paper", "course", "other"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    url: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: true }
);

const LinkSchema = new Schema<ILink>(
  {
    text: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ContentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: ["text", "image", "list", "quote", "code", "equation"],
      required: true,
    },
    text: { type: String },
    links: [LinkSchema],

    image: {
      url: String,
      caption: String,
      credit: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },

    listItems: [{ type: String }],
    quoteAuthor: String,
    codeLanguage: String,

    citations: [{ type: Schema.Types.ObjectId, ref: "Reference" }],
  },
  { _id: true }
);

const SectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true, trim: true },

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

    citations: [{ type: Schema.Types.ObjectId, ref: "Reference" }],

    children: [],
  },
  { _id: true }
);

SectionSchema.add({
  children: [SectionSchema],
});


const RevisionSchema = new Schema<IRevision>(
  {
    editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editedAt: { type: Date, default: Date.now },
    summary: { type: String, trim: true },
  },
  { _id: true }
);

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    abstract: { type: String, required: true, trim: true },
    keywords: [{ type: String, index: true }],

    authors: [AuthorSchema],

    sections: [SectionSchema],

    references: [{ type: Schema.Types.ObjectId, ref: "Reference" }],
    resources: [ResourceSchema],

    scratchPad: { type: String, default: "" },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "in-review", "published", "archived"],
      default: "draft",
      index: true,
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
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Article =
  mongoose.models.ArticleV2 ||
  mongoose.model<IArticle>("ArticleV2", ArticleSchema, "articlesv2");

export const Reference =
  mongoose.models.Reference ||
  mongoose.model<IReference>("Reference", ReferenceSchema, "references");
