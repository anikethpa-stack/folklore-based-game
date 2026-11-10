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
    variantSlug: {
      type: String,
      default: null,
      index: true,
    },
    variantName: {
      type: String,
      default: null,
    },
    variantRules: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    guestToken: {
      type: String,
      default: null,
      index: true,
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
        idempotencyKey: { type: String, default: null, index: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastProcessedIdempotencyKey: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned', 'restarted'],
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
    previousMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
      index: true,
    },
    restartedMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
      index: true,
    },
    aiDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
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

matchSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });
matchSchema.index({ ownerId: 1, createdAt: -1 });

/**
 * Check if the provided user ID is the owner of this match
 */
matchSchema.methods.isOwner = function (userId) {
  if (!userId) return false;
  const userStr = userId.toString();
  return (
    (this.ownerId && this.ownerId.toString() === userStr) ||
    (this.players.player1.userId && this.players.player1.userId.toString() === userStr)
  );
};

/**
 * Check if the provided user ID is a participant (Player 1 or Player 2)
 */
matchSchema.methods.isParticipant = function (userId) {
  if (!userId) return false;
  const userStr = userId.toString();
  return (
    (this.players.player1.userId && this.players.player1.userId.toString() === userStr) ||
    (this.players.player2.userId && this.players.player2.userId.toString() === userStr)
  );
};

module.exports = mongoose.model('Match', matchSchema);
