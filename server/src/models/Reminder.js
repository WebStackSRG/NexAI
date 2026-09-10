import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
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
  remindAt: {
    type: Date,
    required: true,
    index: true,
  },
  itemType: {
    type: String,
    enum: ['library', 'document', 'flashcard', 'custom'],
    default: 'custom',
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reminderSchema.index({ userId: 1, remindAt: 1, isCompleted: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
