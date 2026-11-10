const express = require('express');
const router = express.Router();
const { getFaqs, getGameFaqs } = require('../controllers/faqController');

router.get('/', getFaqs);
router.get('/game/:gameSlug', getGameFaqs);

module.exports = router;

