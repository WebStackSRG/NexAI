import mongoose from 'mongoose';

/**
 * Extracts and deduplicates {{variable}} names from a template string.
 * Supports spaces inside braces like {{ user_name }}.
 *
 * @param {string} template
 * @returns {string[]}
 */
export function extractVariables(template) {
  if (!template || typeof template !== 'string') return [];
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const matches = [...template.matchAll(regex)];
  const vars = matches.map((m) => m[1].trim());
  return [...new Set(vars)];
}

const promptSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    template: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

// Auto-extract {{variable}} placeholders before saving
promptSchema.pre('save', function (next) {
  if (this.isModified('template')) {
    this.variables = extractVariables(this.template);
  }
  next();
});

promptSchema.index({ userId: 1, isFavorite: -1, createdAt: -1 });
promptSchema.index({ title: 'text', template: 'text', tags: 'text', description: 'text' });

export const Prompt = mongoose.model('Prompt', promptSchema);

