import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },

    // Template with {{variable}} placeholders
    template: { type: String, required: true },

    // Extracted variable names (e.g., ['topic', 'tone', 'audience'])
    variables: [{ type: String, trim: true }],

    tags: [{ type: String, trim: true }],
    pinned: { type: Boolean, default: false },
    lastUsedAt: { type: Date },
    useCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    bufferCommands: false,
  },
);

promptSchema.index({ title: "text", template: "text", tags: "text" });

export default mongoose.models.Prompt || mongoose.model("Prompt", promptSchema);
