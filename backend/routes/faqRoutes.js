const express = require('express');
const router = express.Router();
const {
  getFaqs,
  getGameFaqs,
  getFaqById,
} = require('../controllers/faqController');

// 1. General FAQ Listing with search & category filters
router.get('/', getFaqs);

// 2. Game-Specific FAQ Discovery (Placed before /:id to prevent slug interception)
router.get('/game/:gameSlug', getGameFaqs);

// 3. Individual FAQ Item Retrieval by MongoDB ID
router.get('/:id', getFaqById);

module.exports = router;
