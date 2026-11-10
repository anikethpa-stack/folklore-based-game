const FAQ = require('../models/FAQ');

/**
 * @desc    Get all published FAQs (with category / search filtering)
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
      filter.gameSlug = gameSlug;
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: 1 });

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
 * @desc    Get FAQs specific to a game
 * @route   GET /api/games/:gameId/faqs
 * @access  Public
 */
const getGameFaqs = async (req, res) => {
  try {
    const { gameSlug } = req.params;
    const faqs = await FAQ.find({
      gameSlug: gameSlug.toLowerCase(),
      status: 'published',
    }).sort({ order: 1 });

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
  getGameFaqs,
};

