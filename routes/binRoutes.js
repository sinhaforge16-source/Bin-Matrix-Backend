const express = require('express');
const router = express.Router();
const {
  getBins,
  getBinMonitoringSummary,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
} = require('../controllers/binController');

// Map monitoring summary endpoint
router.get('/monitoring-summary', getBinMonitoringSummary);

// Standard CRUD endpoints
router.route('/').get(getBins).post(createBin);
router.route('/:id').get(getBinById).put(updateBin).delete(deleteBin);

module.exports = router;
