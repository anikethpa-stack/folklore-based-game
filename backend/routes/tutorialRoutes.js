const express = require('express');
const router = express.Router();
const { getTutorials, getGameTutorial } = require('../controllers/tutorialController');

router.get('/', getTutorials);
router.get('/:gameSlug', getGameTutorial);

module.exports = router;

