const express = require('express');
const router = express.Router();
const {
  submitContribution,
  getMyContributions,
  getAllContributions,
  moderateContribution,
} = require('../controllers/contributionController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public or Authenticated submission
router.post('/', submitContribution);

// Protected routes
router.get('/my', protect, getMyContributions);

// Admin-only moderation routes
router.get('/all', protect, requireAdmin, getAllContributions);
router.patch('/:id/moderate', protect, requireAdmin, moderateContribution);

module.exports = router;

