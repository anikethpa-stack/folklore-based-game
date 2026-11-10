const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Game name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    alternateNames: [{ type: String, trim: true }],
    category: {
      type: String,
      required: true,
      enum: ['Hunt & Strategy', 'Mancala & Sowing', 'Race & Alignment', 'Courtyard Classic'],
      index: true,
    },
    origin: {
      type: String,
      required: true,
    },
    estimatedAge: {
      type: String,
      default: 'Ancient',
    },
    players: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 2 },
      recommended: { type: Number, default: 2 },
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    historicalBackground: {
      type: String,
      required: [true, 'Historical background is required'],
    },
    culturalSignificance: {
      type: String,
      default: '',
    },
    isReconstruction: {
      type: Boolean,
      default: false,
    },
    reconstructionNotes: {
      type: String,
      default: '',
    },
    boardConfiguration: {
      boardType: { type: String, required: true },
      pointCount: { type: Number },
      pitCount: { type: Number },
      counterType: { type: String, default: 'Counters' },
      layoutDescription: { type: String },
    },
    rules: {
      objective: { type: String, required: true },
      setup: { type: String, required: true },
      turnStructure: { type: String, required: true },
      movement: { type: String, required: true },
      capturing: { type: String, required: true },
      winningCondition: { type: String, required: true },
    },
    references: [
      {
        title: { type: String, required: true },
        author: { type: String },
        year: { type: String },
        citationType: {
          type: String,
          enum: [
            'Archaeological',
            'Epigraphical',
            'Academic Publication',
            'Oral Tradition / Ethnographic',
            'Ethnographic',
            'Historical Text',
          ],
          default: 'Academic Publication',
        },
        url: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    badgeTheme: {
      type: String,
      enum: ['terracotta', 'forest', 'ochre'],
      default: 'terracotta',
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search across name, alternateNames, and description
gameSchema.index({
  name: 'text',
  alternateNames: 'text',
  description: 'text',
  origin: 'text',
});

module.exports = mongoose.model('Game', gameSchema);
