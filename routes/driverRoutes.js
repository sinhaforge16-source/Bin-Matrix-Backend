const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getDrivers).post(createDriver);
router.route('/:id').get(getDriverById).put(updateDriver).delete(deleteDriver);

module.exports = router;

