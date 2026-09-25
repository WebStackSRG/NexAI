import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
  },
  { timestamps: true },
);

chatSchema.index({ userId: 1, createdAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
