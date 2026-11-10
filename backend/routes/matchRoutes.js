const express = require('express');
const router = express.Router();
const {
  createMatch,
  getMatchById,
  resumeMatch,
  getSavedMatches,
  submitMove,
  triggerAIMove,
  restartMatch,
  getMatchHistory,
} = require('../controllers/matchController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// 1. Strictly Protected: User Match History & Active Saved Games
router.get('/history', protect, getMatchHistory);
router.get('/saved', protect, getSavedMatches);

// 2. Match Creation (Attaches user if logged in; generates guestToken if guest)
router.post('/', optionalAuth, createMatch);

// 3. Match Operations with Controller-level Ownership Verification
router.get('/:id/resume', optionalAuth, resumeMatch); // Authoritative resume verification
router.get('/:id', optionalAuth, getMatchById);
router.post('/:id/moves', optionalAuth, submitMove);
router.post('/:id/ai-move', optionalAuth, triggerAIMove);
router.post('/:id/restart', optionalAuth, restartMatch);

module.exports = router;
