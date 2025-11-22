import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
    },
    pathname: {
      type: String,
    },
  },
  { timestamps: true }
);

const View =
  mongoose.models.View || mongoose.model("View", viewSchema, "views");

export default View;
