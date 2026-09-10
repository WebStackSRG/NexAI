import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  sourceType: {
    type: String,
    enum: ['libraryItem', 'document', 'chat', 'manual', 'ai-generated'],
    default: 'manual',
  },
  topic: {
    type: String,
    trim: true,
    default: 'General',
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  easeFactor: {
    type: Number,
    default: 2.5,
  },
  interval: {
    type: Number,
    default: 1, // days
  },
  repetitions: {
    type: Number,
    default: 0,
  },
  nextReviewAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

flashcardSchema.index({ userId: 1, nextReviewAt: 1 });

export default mongoose.models.Flashcard || mongoose.model('Flashcard', flashcardSchema);
