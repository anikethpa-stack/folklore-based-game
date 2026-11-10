const mongoose = require('mongoose');

const gameVariantSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    variantName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
    },
    differences: [
      {
        type: String,
        required: true,
      },
    ],
    rulesSummary: {
      type: String,
      required: true,
    },
    historicalNotes: {
      type: String,
      default: '',
    },
    references: [
      {
        title: { type: String },
        author: { type: String },
        year: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

gameVariantSchema.index({ gameId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('GameVariant', gameVariantSchema);

