const mongoose = require('mongoose');

const vehicleHistorySchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      index: true,
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date string is required (YYYY-MM-DD)'],
      trim: true,
      index: true,
    },
    wasteType: {
      type: String,
      required: true,
      default: 'Organic Waste',
    },
    logs: [
      {
        timePeriod: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['Online', 'Idle', 'Offline'],
          required: true,
        },
        speedKmh: {
          type: Number,
          default: 0,
        },
        countedAs: {
          type: String,
          required: true,
        },
      },
    ],
    dailyTotals: {
      distanceKm: {
        type: Number,
        default: 0,
      },
      fuelLiters: {
        type: Number,
        default: 0,
      },
      activeTime: {
        type: String,
        default: '0 min',
      },
      idleTime: {
        type: String,
        default: '0 min',
      },
      offlineTime: {
        type: String,
        default: '0 min',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per vehicle and date
vehicleHistorySchema.index({ vehicleId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('VehicleHistory', vehicleHistorySchema);
