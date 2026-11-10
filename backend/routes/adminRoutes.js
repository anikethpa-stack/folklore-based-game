const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  updateGame,
  createFaq,
  updateFaq,
  deleteFaq,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All administration routes strictly require authentication & admin role
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getPlatformStats);
router.patch('/games/:id', updateGame);
router.post('/faqs', createFaq);
router.patch('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

module.exports = router;

