const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    truckNumber: {
      type: String,
      required: [true, 'Truck number is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Truck category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste'],
        message: '{VALUE} is not a valid category',
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Online', 'Offline'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Online',
    },
    isIdle: {
      type: Boolean,
      default: false,
    },
    totalDistanceKm: {
      type: Number,
      default: 0,
      min: [0, 'Distance cannot be negative'],
    },
    fuelConsumption: {
      type: Number,
      default: 0,
      min: [0, 'Fuel consumption cannot be negative'],
    },
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    currentRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Truck', truckSchema);

