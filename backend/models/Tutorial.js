const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    gameSlug: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    summary: {
      type: String,
      required: true,
    },
    steps: [
      {
        stepNumber: { type: Number, required: true },
        title: { type: String, required: true },
        instruction: { type: String, required: true },
        explanation: { type: String, required: true },
        boardSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        expectedAction: {
          actionType: { type: String }, // 'place', 'move', 'jump', 'sow'
          from: { type: mongoose.Schema.Types.Mixed },
          to: { type: mongoose.Schema.Types.Mixed },
        },
        hint: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tutorial', tutorialSchema);

