import mongoose from "mongoose";

/* ---------- IMAGE SUB-SCHEMA ---------- */
const ImageSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    url: { type: String, required: true },
    filename: String,
    title: String,
    description: String,
    caption: String,
    attribution: String, // e.g., "Wikimedia / Author"
  },
  { _id: false }
);

/* ---------- CITATION SUB-SCHEMA ---------- */
const CitationSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  text: { type: String, required: true }, // short citation text
  url: String,
  authors: [String],
  publisher: String,
  publishedDate: Date,
  accessedDate: Date,
  note: String,
  number: Number, // generated automatically on save
});

/* ---------- RESOURCE SUB-SCHEMA ---------- */
const ResourceSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },

    daysToComplete: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
      description: "Estimated number of days spent on research",
    },

    sites: [
      {
        name: String,
        url: { type: String, required: true },
        note: String, // optional summary of what was used from this source
      },
    ],

    books: [
      {
        title: { type: String, required: true },
        author: String,
        publisher: String,
        publishedDate: Date,
        note: String, // e.g. “used for historical timeline details”
      },
    ],

    youtubeVideos: [
      {
        title: String,
        url: { type: String, required: true },
        channel: String,
        uploadedDate: Date,
        note: String, // what part of the video helped
      },
    ],

    lastReviewed: {
      type: Date,
      default: Date.now,
      description: "Last date when this resource was verified or reviewed",
    },
  },
  { _id: false }
);

const viewSchema = new mongoose.Schema(
  {
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
  },
  { _id: false }
);

/* ---------- BLOCKS (content structure) ---------- */
const BlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["text", "image", "citation", "embed", "heading"],
      required: true,
    },

    // Text content (HTML)
    content: String,

    // References
    image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
    citation: { type: mongoose.Schema.Types.ObjectId, ref: "Citation" },

    // Optional extras
    caption: String,
    level: Number,
  },
  { _id: true }
);

/* ---------- MAIN ARTICLE SCHEMA ---------- */
const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  slug: { type: String, required: true, index: true, unique: true },
  excerpt: String,
  tags: [String],

  featuredImage: ImageSchema,
  images: [ImageSchema],
  citations: [CitationSchema],
  sources: [String], // URLs
  blocks: [BlockSchema],

  seo: {
    metaTitle: String,
    metaDescription: String,
    canonical: String,
  },

  resources: ResourceSchema,
  views: [viewSchema],
  scratchpad: String,

  status: { type: String, enum: ["draft", "published"], default: "draft" },
  researchedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  readingTime: Number,
  wordCount: Number,
});

/* ---------- PRE-SAVE HOOKS ---------- */
ArticleSchema.pre("save", function () {
  this.updatedAt = new Date();

  // Compute word count + reading time
  const text = (this.blocks || [])
    .filter((b) => b.type === "text")
    .map((b) => b.content || "")
    .join(" ");
  const words = text
    .replace(/<[^>]+>/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  this.wordCount = words;
  this.readingTime = Math.max(1, Math.round(words / 200));

  // Auto-assign citation numbers sequentially
  if (this.citations && this.citations.length) {
    this.citations.forEach((c, i) => (c.number = i + 1));
  }
});

/* ---------- EXPORT ---------- */
export default mongoose.models.Article ||
  mongoose.model("Article", ArticleSchema);
