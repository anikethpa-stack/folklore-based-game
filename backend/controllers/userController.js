const User = require('../models/User');
const Match = require('../models/Match');
const Bookmark = require('../models/Bookmark');

/**
 * @desc    Get user profile with match history summary & bookmarks
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user details
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch user match count and win stats
    const totalMatches = await Match.countDocuments({
      $or: [{ ownerId: userId }, { 'players.player1.userId': userId }],
    });

    const completedCount = await Match.countDocuments({
      $or: [{ ownerId: userId }, { 'players.player1.userId': userId }],
      status: 'completed',
    });

    const recentMatches = await Match.find({
      $or: [{ ownerId: userId }, { 'players.player1.userId': userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('gameId', 'name slug badgeTheme');

    // Count bookmarks
    const bookmarkCount = await Bookmark.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        stats: {
          totalMatches,
          completedCount,
          bookmarks: bookmarkCount,
        },
        recentMatches,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile bio & display name
 * @route   PATCH /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, favoriteGame } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (displayName) user.profile.displayName = displayName.trim();
    if (bio !== undefined) user.profile.bio = bio.trim();
    if (favoriteGame) user.profile.favoriteGame = favoriteGame.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated.',
      data: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};

