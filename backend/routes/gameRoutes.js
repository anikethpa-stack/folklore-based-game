const express = require('express');
const router = express.Router();
const {
  getGames,
  getGameByIdOrSlug,
  getGameVariants,
} = require('../controllers/gameController');
const { getGameFaqs } = require('../controllers/faqController');

// Public Game Discovery Endpoints
router.get('/', getGames);
router.get('/:idOrSlug', getGameByIdOrSlug);
router.get('/:idOrSlug/variants', getGameVariants);
router.get('/:idOrSlug/faqs', getGameFaqs);

module.exports = router;

