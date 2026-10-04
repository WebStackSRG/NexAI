import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'global_config',
    },
    billingEnforcementMode: {
      type: String,
      enum: ['quota_free', 'credit_strict'],
      default: 'quota_free',
      required: true,
    },
    dailyGeminiQuotaLimit: {
      type: Number,
      default: 1500,
      required: true,
      min: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
