const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');

/**
 * @desc    Get all published FAQs (with category / search / gameSlug filtering)
 * @route   GET /api/faqs
 * @access  Public
 */
const getFaqs = async (req, res) => {
  try {
    const { category, search, gameSlug } = req.query;
    const filter = { status: 'published' };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (gameSlug) {
      if (gameSlug.toLowerCase() === 'general') {
        filter.$or = [{ gameSlug: null }, { gameSlug: '' }, { category: 'General' }];
      } else {
        filter.$or = [
          { gameSlug: gameSlug.toLowerCase() },
          { category: gameSlug === 'aadu-puli-aatam' ? 'Aadu Puli Aatam' : gameSlug === 'pallanguzhi' ? 'Pallanguzhi' : gameSlug },
        ];
      }
    }

    let faqs = [];

    // Search query support
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const regex = new RegExp(trimmedSearch, 'i');

      const searchFilter = {
        ...filter,
        $or: [{ question: regex }, { answer: regex }],
      };

      faqs = await FAQ.find(searchFilter).sort({ order: 1, createdAt: 1 });
    } else {
      faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 });
    }

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single FAQ by ID
 * @route   GET /api/faqs/:id
 * @access  Public
 */
const getFaqById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid FAQ ID format.',
      });
    }

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        code: 'FAQ_NOT_FOUND',
        message: 'FAQ item not found.',
      });
    }

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve FAQ.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get FAQs specific to a game (by gameSlug or game ObjectId)
 * @route   GET /api/faqs/game/:gameSlugOrId OR /api/games/:idOrSlug/faqs
 * @access  Public
 */
const getGameFaqs = async (req, res) => {
  try {
    const rawParam =
      req.params.gameSlug ||
      req.params.gameSlugOrId ||
      req.params.idOrSlug ||
      req.params.gameId ||
      '';

    if (!rawParam) {
      return res.status(400).json({
        success: false,
        message: 'Game slug or ID is required to retrieve game FAQs.',
      });
    }

    let targetSlug = rawParam.toLowerCase();

    // Check if rawParam is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(rawParam)) {
      const Game = require('../models/Game');
      const foundGame = await Game.findById(rawParam);
      if (foundGame) {
        targetSlug = foundGame.slug.toLowerCase();
      }
    }

    // Determine category matching traditional game
    const categoryName =
      targetSlug === 'aadu-puli-aatam'
        ? 'Aadu Puli Aatam'
        : targetSlug === 'pallanguzhi'
        ? 'Pallanguzhi'
        : null;

    const query = {
      status: 'published',
      $or: [{ gameSlug: targetSlug }],
    };

    if (categoryName) {
      query.$or.push({ category: categoryName });
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: 1 });

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch game FAQs.',
      error: error.message,
    });
  }
};

module.exports = {
  getFaqs,
  getFaqById,
  getGameFaqs,
};
