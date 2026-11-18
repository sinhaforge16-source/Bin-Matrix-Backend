const express = require('express');
const router = express.Router();
const {
  getReportAnalytics,
  getAllReportMetrics,
  createReportMetric,
} = require('../controllers/reportController');

// @route   GET /api/reports/analytics
router.get('/analytics', getReportAnalytics);

// @route   GET /api/reports, POST /api/reports
router.route('/').get(getAllReportMetrics).post(createReportMetric);

module.exports = router;
