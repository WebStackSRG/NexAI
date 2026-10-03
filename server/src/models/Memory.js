import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fact: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['identity', 'preference', 'project', 'fact', 'instruction'],
      default: 'fact',
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    sourceChatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null,
    },
    sourceMessage: {
      type: String,
      default: null,
      trim: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    vectorId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

memorySchema.index({ userId: 1, active: 1, createdAt: -1 });
memorySchema.index({ userId: 1, category: 1 });

export const Memory = mongoose.model('Memory', memorySchema);
