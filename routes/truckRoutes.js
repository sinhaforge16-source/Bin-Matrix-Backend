const express = require('express');
const router = express.Router();
const {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
} = require('../controllers/truckController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getTrucks).post(createTruck);
router.route('/:id').get(getTruckById).put(updateTruck).delete(deleteTruck);

module.exports = router;

