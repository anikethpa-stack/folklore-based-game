const express = require('express');
const router = express.Router();
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getBookmarks);
router.post('/:gameId', addBookmark);
router.delete('/:gameId', removeBookmark);

module.exports = router;

