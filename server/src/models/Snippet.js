import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
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
  language: {
    type: String,
    required: true,
    trim: true,
    default: 'javascript',
  },
  code: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

snippetSchema.index({ title: 'text', code: 'text', tags: 'text' });

export default mongoose.models.Snippet || mongoose.model('Snippet', snippetSchema);
