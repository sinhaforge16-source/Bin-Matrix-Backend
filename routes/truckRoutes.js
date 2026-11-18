const express = require('express');
const router = express.Router();
const {
  getTrucks,
  getTruckById,
  getVehicleHistory,
  createTruck,
  updateTruck,
  deleteTruck,
  createVehicleHistory,
  getTruckHistory,
} = require('../controllers/truckController');

// Vehicle History endpoints (must be before /:id)
router
  .route('/:vehicleId/history')
  .get(getVehicleHistory)
  .post(createVehicleHistory);

// Vehicle fleet CRUD endpoints
router.get('/:id/history', getTruckHistory);
router.route('/').get(getTrucks).post(createTruck);
router.route('/:id').get(getTruckById).put(updateTruck).delete(deleteTruck);

module.exports = router;
