const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getOptimizedRoute,
  confirmRoute,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../controllers/routeController');

// Route optimization endpoints (must be defined before /:id)
router.get('/optimized', getOptimizedRoute);
router.post('/confirm', confirmRoute);

// Standard CRUD endpoints
router.route('/').get(getRoutes).post(createRoute);
router.route('/:id').get(getRouteById).put(updateRoute).delete(deleteRoute);

module.exports = router;
