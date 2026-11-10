const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bookmarks by the same user for the same game
bookmarkSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);

