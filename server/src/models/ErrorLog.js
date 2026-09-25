import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema(
  {
    route: { type: String, required: true },
    method: { type: String, required: true },
    status: { type: Number, required: true },
    message: { type: String, required: true },
    stack: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

errorLogSchema.index({ createdAt: -1 });

export const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);
