import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['resume', 'report', 'notes', 'other'],
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
  },
  { timestamps: true },
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ title: 'text', 'sections.body': 'text' });

export const Document = mongoose.model('Document', documentSchema);
