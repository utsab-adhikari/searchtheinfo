import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    filename: String,
    title: String,
    description: String,
    caption: String,
    attribution: String,
  },
  { timestamps: true }
);

const Image = mongoose.models.Image || mongoose.model("Image", imageSchema);

export default Image;
