const express = require('express');
const router = express.Router();
const {
  getBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
} = require('../controllers/binController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getBins).post(createBin);
router.route('/:id').get(getBinById).put(updateBin).delete(deleteBin);

module.exports = router;

