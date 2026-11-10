const Tutorial = require('../models/Tutorial');

/**
 * @desc    Get all available tutorials
 * @route   GET /api/tutorials
 * @access  Public
 */
const getTutorials = async (req, res) => {
  try {
    const tutorials = await Tutorial.find({ status: 'active' }).populate(
      'gameId',
      'name slug category badgeTheme'
    );

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      count: tutorials.length,
      data: tutorials,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tutorials list.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get tutorial by game slug
 * @route   GET /api/tutorials/:gameSlug
 * @access  Public
 */
const getGameTutorial = async (req, res) => {
  try {
    const { gameSlug } = req.params;
    const tutorial = await Tutorial.findOne({
      gameSlug: gameSlug.toLowerCase(),
      status: 'active',
    }).populate('gameId', 'name slug category rules');

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutorial not found for this game.',
      });
    }

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

    return res.status(200).json({
      success: true,
      data: tutorial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tutorial.',
      error: error.message,
    });
  }
};

module.exports = {
  getTutorials,
  getGameTutorial,
};

