import mongoose from 'mongoose';

const linkItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
});

const workspaceSessionSchema = new mongoose.Schema({
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
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  links: [linkItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.WorkspaceSession || mongoose.model('WorkspaceSession', workspaceSessionSchema);
