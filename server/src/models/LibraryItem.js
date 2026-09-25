import mongoose from 'mongoose';

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
      enum: ['link', 'note'],
      required: true,
    },
    url: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    content: {
      type: String,
    },
    vectorId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

libraryItemSchema.index({ userId: 1, createdAt: -1 });
libraryItemSchema.index({ title: 'text', summary: 'text', tags: 'text' });

export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);
