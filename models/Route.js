const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Plastic', 'Paper', 'Organic waste'],
      default: 'Plastic',
    },
    assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      default: null,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    },
    bins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
      },
    ],
    waypoints: [
      {
        name: String,
        latitude: Number,
        longitude: Number,
        sequenceOrder: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Route', routeSchema);

