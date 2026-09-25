import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amountINR: {
      type: Number,
      required: true,
    },
    creditsAdded: {
      type: Number,
      required: true,
    },
    paymentGateway: {
      type: String,
      default: 'razorpay_test',
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    orderId: {
      type: String,
    },
    planId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
