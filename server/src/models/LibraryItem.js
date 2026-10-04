import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    body: { type: String, required: true },
  },
  { _id: false },
);

const libraryItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['link', 'note', 'document', 'file', 'interview'],
      required: true,
      index: true,
    },
    // Common fields
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    content: {
      type: String,
      default: '',
    },
    vectorId: {
      type: String,
      default: null,
    },
    vectorIds: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },


    // Link specific
    url: {
      type: String,
      trim: true,
    },

    // Document specific
    category: {
      type: String,
      enum: ['resume', 'report', 'spec', 'notes', 'other'],
      default: 'other',
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
    fileFormat: {
      type: String,
      default: 'pdf',
    },

    // File upload specific
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    fileData: {
      type: String,
      default: '',
    },

    // Interview specific (Step 9 preparation)
    scorecard: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    transcript: {
      type: Array,
      default: [],
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

libraryItemSchema.index({ userId: 1, createdAt: -1 });
libraryItemSchema.index({ userId: 1, type: 1, createdAt: -1 });
libraryItemSchema.index({
  title: 'text',
  summary: 'text',
  tags: 'text',
  content: 'text',
  'sections.heading': 'text',
  'sections.body': 'text',
});

export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);
