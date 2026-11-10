const Bookmark = require('../models/Bookmark');
const Game = require('../models/Game');

/**
 * @desc    Get all bookmarks for the authenticated user
 * @route   GET /api/bookmarks
 * @access  Private
 */
const getBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .populate('gameId', 'name slug category origin difficulty description badgeTheme');

    return res.status(200).json({
      success: true,
      count: bookmarks.length,
      data: bookmarks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmarks.',
      error: error.message,
    });
  }
};

/**
 * @desc    Bookmark a game
 * @route   POST /api/bookmarks/:gameId
 * @access  Private
 */
const addBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    // Verify game exists (can be ObjectId or slug)
    let game;
    if (gameId.match(/^[0-9a-fA-F]{24}$/)) {
      game = await Game.findById(gameId);
    } else {
      game = await Game.findOne({ slug: gameId.toLowerCase() });
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.',
      });
    }

    // Upsert bookmark to prevent duplicates
    const bookmark = await Bookmark.findOneAndUpdate(
      { userId, gameId: game._id },
      { userId, gameId: game._id },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Game successfully bookmarked.',
      data: bookmark,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to bookmark game.',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove a bookmark
 * @route   DELETE /api/bookmarks/:gameId
 * @access  Private
 */
const removeBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    let targetGameId = gameId;
    if (!gameId.match(/^[0-9a-fA-F]{24}$/)) {
      const game = await Game.findOne({ slug: gameId.toLowerCase() });
      if (game) targetGameId = game._id;
    }

    await Bookmark.findOneAndDelete({ userId, gameId: targetGameId });

    return res.status(200).json({
      success: true,
      message: 'Bookmark removed.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove bookmark.',
      error: error.message,
    });
  }
};

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
};

