const express = require('express');
const router = express.Router();
const {
  createMatch,
  getMatchById,
  submitMove,
  restartMatch,
  getMatchHistory,
} = require('../controllers/matchController');

// Match Gameplay Endpoints
router.post('/', createMatch);
router.get('/history', getMatchHistory);
router.get('/:id', getMatchById);
router.post('/:id/moves', submitMove);
router.post('/:id/restart', restartMatch);

module.exports = router;

