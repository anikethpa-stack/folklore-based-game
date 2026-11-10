const mongoose = require('mongoose');
const Game = require('../models/Game');
const GameVariant = require('../models/GameVariant');

/**
 * @desc    Get all games (with optional category and search filters)
 * @route   GET /api/games
 * @access  Public
 */
const getGames = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    const filter = { status: 'active' };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const games = await Game.find(filter)
      .sort({ createdAt: -1 })
      .select('name slug alternateNames category origin estimatedAge difficulty description boardConfiguration badgeTheme status');

    // HTTP Cache Strategy: Stale-While-Revalidate (Section 7)
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve games collection.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get detailed game information by ID or Slug
 * @route   GET /api/games/:idOrSlug
 * @access  Public
 */
const getGameByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug.toLowerCase() };
    }

    const game = await Game.findOne(query);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Traditional game record not found.',
      });
    }

    // Retrieve associated regional variants
    const variants = await GameVariant.find({ gameId: game._id });

    // HTTP Cache Strategy: Stale-While-Revalidate (Section 7)
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      data: {
        ...game.toObject(),
        variants,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch game details.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all regional variations for a specific game
 * @route   GET /api/games/:idOrSlug/variants
 * @access  Public
 */
const getGameVariants = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let game;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      game = await Game.findById(idOrSlug);
    } else {
      game = await Game.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.',
      });
    }

    const variants = await GameVariant.find({ gameId: game._id });

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      count: variants.length,
      data: variants,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve game variants.',
      error: error.message,
    });
  }
};

module.exports = {
  getGames,
  getGameByIdOrSlug,
  getGameVariants,
};

