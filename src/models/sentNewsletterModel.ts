import mongoose from "mongoose";

const sentNewsletterSchema = new mongoose.Schema(
  {
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewsletterTemplate",
      required: true,
    },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    text: { type: String },
    audienceDescription: { type: String },
    recipientsCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed"],
      default: "queued",
    },
    errorMessage: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const SentNewsletter =
  mongoose.models.SentNewsletter ||
  mongoose.model("SentNewsletter", sentNewsletterSchema);

export default SentNewsletter;
