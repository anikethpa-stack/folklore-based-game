const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
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
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameVariant',
      default: null,
    },
    mode: {
      type: String,
      enum: ['pass_and_play', 'vs_ai', 'practice'],
      default: 'pass_and_play',
    },
    players: {
      player1: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        name: { type: String, default: 'Player 1' },
        role: { type: String, default: 'player1' }, // 'goats' or 'player1'
      },
      player2: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        name: { type: String, default: 'Player 2' },
        role: { type: String, default: 'player2' }, // 'tigers' or 'player2'
        isAI: { type: Boolean, default: false },
      },
    },
    boardState: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    currentTurn: {
      type: String,
      required: true, // 'goats' | 'tigers' or 'player1' | 'player2'
    },
    moveHistory: [
      {
        moveNumber: { type: Number, required: true },
        player: { type: String, required: true },
        actionType: { type: String, default: 'move' }, // 'place', 'move', 'jump', 'sow'
        from: { type: mongoose.Schema.Types.Mixed, default: null },
        to: { type: mongoose.Schema.Types.Mixed, default: null },
        captured: { type: mongoose.Schema.Types.Mixed, default: null },
        timestamp: { type: Date, default: Date.now },
        snapshot: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    winner: {
      type: String,
      default: null, // 'goats', 'tigers', 'player1', 'player2', 'draw'
    },
    winReason: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Match', matchSchema);

