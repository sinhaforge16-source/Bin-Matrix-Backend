const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../controllers/routeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getRoutes).post(createRoute);
router.route('/:id').get(getRouteById).put(updateRoute).delete(deleteRoute);

module.exports = router;

