const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contributorName: {
      type: String,
      required: true,
      trim: true,
    },
    contributorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    gameSlug: {
      type: String,
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      required: true,
      enum: ['regional_variant', 'historical_reference', 'oral_rule', 'cultural_lore'],
      default: 'regional_variant',
    },
    title: {
      type: String,
      required: [true, 'Submission title is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Geographic region or community origin is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Description of rules or memories is required'],
    },
    references: {
      type: String,
      default: '',
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatorNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contribution', contributionSchema);

