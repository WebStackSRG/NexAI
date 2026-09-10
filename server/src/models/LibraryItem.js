import mongoose from "mongoose";

const libraryItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["link", "note", "file", "document", "youtube"],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
  },
  content: {
    type: String,
  },
  summary: {
    type: String,
  },
  fileKey: {
    type: String,
  },
  mimeType: {
    type: String,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  folder: {
    type: String,
    default: "Uncategorized",
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  vectorId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "broken", "archived"],
    default: "pending",
  },
  lastCheckedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

libraryItemSchema.index({
  title: "text",
  summary: "text",
  content: "text",
  tags: "text",
});
libraryItemSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

export default mongoose.model("LibraryItem", libraryItemSchema);

