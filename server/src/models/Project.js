import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    originalName: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      default: 'text/plain',
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    customInstructions: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    color: {
      type: String,
      default: '#8b5cf6',
      trim: true,
      maxlength: 30,
    },
    icon: {
      type: String,
      default: 'folder',
      trim: true,
      maxlength: 30,
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
  },
  { timestamps: true },
);

projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
