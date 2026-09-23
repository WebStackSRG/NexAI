import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

promptSchema.index({ userId: 1, createdAt: -1 });
promptSchema.index({ title: 'text', template: 'text', tags: 'text' });

export const Prompt = mongoose.model('Prompt', promptSchema);
