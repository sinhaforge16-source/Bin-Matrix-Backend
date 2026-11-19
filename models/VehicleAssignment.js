const mongoose = require('mongoose');

const vehicleAssignmentSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      trim: true,
    },
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      trim: true,
    },
    driverName: {
      type: String,
      required: [true, 'Driver Name is required'],
      trim: true,
    },
    route: {
      type: String,
      required: [true, 'Route is required'],
      trim: true,
    },
    wasteType: {
      type: String,
      required: [true, 'Waste Type is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Pending', 'Idle'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

vehicleAssignmentSchema.index({ wasteType: 1, vehicleId: 1 });
vehicleAssignmentSchema.index({ driverId: 1 });

module.exports = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);
