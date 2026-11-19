const express = require('express');
const router = express.Router();
const {
  getVehicleAssignments,
  getVehicleAssignmentById,
  createVehicleAssignment,
  updateVehicleAssignment,
  deleteVehicleAssignment,
} = require('../controllers/vehicleAssignmentController');

router
  .route('/')
  .get(getVehicleAssignments)
  .post(createVehicleAssignment);

router
  .route('/:id')
  .get(getVehicleAssignmentById)
  .put(updateVehicleAssignment)
  .delete(deleteVehicleAssignment);

module.exports = router;
