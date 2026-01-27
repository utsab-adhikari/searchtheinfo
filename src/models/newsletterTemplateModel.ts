import mongoose from "mongoose";

const newsletterTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["manual", "article_published"],
      default: "manual",
    },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    text: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NewsletterTemplate =
  mongoose.models.NewsletterTemplate ||
  mongoose.model("NewsletterTemplate", newsletterTemplateSchema);

export default NewsletterTemplate;
