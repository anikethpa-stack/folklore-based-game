const express = require('express');
const router = express.Router();
const {
  getGames,
  getGameByIdOrSlug,
  getGameVariants,
} = require('../controllers/gameController');

// Public Game Discovery Endpoints
router.get('/', getGames);
router.get('/:idOrSlug', getGameByIdOrSlug);
router.get('/:idOrSlug/variants', getGameVariants);

module.exports = router;

