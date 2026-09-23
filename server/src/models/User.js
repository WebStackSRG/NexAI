import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    wallet: {
      creditsRemaining: {
        type: Number,
        default: 100,
        min: 0,
      },
      tier: {
        type: String,
        enum: ['free', 'pro_monthly'],
        default: 'free',
      },
      totalTokensConsumed: {
        type: Number,
        default: 0,
      },
    },
    settings: {
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark',
      },
      defaultModel: {
        type: String,
        enum: ['flash', 'pro'],
        default: 'flash',
      },
      webSearchDefaultOn: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
