import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "" },
    body: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true, trim: true },
    sections: [sectionSchema],

    // Version history (shallow snapshot of previous states)
    versionHistory: [
      {
        sections: [sectionSchema],
        savedAt: { type: Date, default: Date.now },
        label: { type: String },
      },
    ],

    exportFormats: [{ type: String, enum: ["pdf", "docx"] }],
    libraryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LibraryItem",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    bufferCommands: false,
  },
);

documentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Document ||
  mongoose.model("Document", documentSchema);

