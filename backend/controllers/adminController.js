const Game = require('../models/Game');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Match = require('../models/Match');
const Contribution = require('../models/Contribution');
const { bumpContentVersion } = require('../middleware/cacheMiddleware');

/**
 * @desc    Get system-wide platform statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalMatches, totalContributions, totalGames, pendingContributions] =
      await Promise.all([
        User.countDocuments(),
        Match.countDocuments(),
        Contribution.countDocuments(),
        Game.countDocuments(),
        Contribution.countDocuments({ moderationStatus: 'pending' }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalMatches,
        totalContributions,
        pendingContributions,
        totalGames,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin statistics.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update game details or status
 * @route   PATCH /api/admin/games/:id
 * @access  Private (Admin only)
 */
const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const game = await Game.findByIdAndUpdate(id, updates, { new: true });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }

    const newVersion = bumpContentVersion();
    return res.status(200).json({
      success: true,
      message: 'Game details successfully updated.',
      data: game,
      contentVersion: newVersion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update game.',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new FAQ
 * @route   POST /api/admin/faqs
 * @access  Private (Admin only)
 */
const createFaq = async (req, res) => {
  try {
    const { question, answer, category, gameSlug, difficulty, order } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and category are required.',
      });
    }

    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category,
      gameSlug: gameSlug || null,
      difficulty: difficulty || 'All',
      order: order !== undefined ? Number(order) : 0,
      status: 'published',
    });

    const newVersion = bumpContentVersion();
    return res.status(201).json({
      success: true,
      message: 'FAQ successfully published.',
      data: faq,
      contentVersion: newVersion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create FAQ.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing FAQ
 * @route   PATCH /api/admin/faqs/:id
 * @access  Private (Admin only)
 */
const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const faq = await FAQ.findByIdAndUpdate(id, updates, { new: true });
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found.' });
    }

    const newVersion = bumpContentVersion();
    return res.status(200).json({
      success: true,
      message: 'FAQ successfully updated.',
      data: faq,
      contentVersion: newVersion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update FAQ.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete an FAQ
 * @route   DELETE /api/admin/faqs/:id
 * @access  Private (Admin only)
 */
const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found.' });
    }

    const newVersion = bumpContentVersion();
    return res.status(200).json({
      success: true,
      message: 'FAQ successfully deleted.',
      contentVersion: newVersion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ.',
      error: error.message,
    });
  }
};

module.exports = {
  getPlatformStats,
  updateGame,
  createFaq,
  updateFaq,
  deleteFaq,
};

