import mongoose from "mongoose";

const secretSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  label: { type: String, required: true, trim: true },
  category: { type: String, enum: ["api_key", "password", "crypto", "note", "other"], default: "api_key" },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

secretSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Secret || mongoose.model("Secret", secretSchema);
