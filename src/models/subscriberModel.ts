import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed", "bounced"],
      default: "subscribed",
    },
    source: {
      type: String,
      enum: ["homepage", "manual", "import", "other"],
      default: "homepage",
    },
    unsubscribeToken: { type: String, required: true, unique: true },
    lastSentAt: { type: Date },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true }
);

const Subscriber =
  mongoose.models.Subscriber || mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
