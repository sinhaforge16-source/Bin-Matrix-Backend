const mongoose = require('mongoose');

const reportMetricSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste'],
        message: '{VALUE} is not a valid category',
      },
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date string is required (e.g. 14/10/2025)'],
      trim: true,
    },
    cleanedOnTime: {
      type: Number,
      default: 0,
      min: [0, 'Value cannot be negative'],
    },
    cleanedLate: {
      type: Number,
      default: 0,
      min: [0, 'Value cannot be negative'],
    },
    notCleaned: {
      type: Number,
      default: 0,
      min: [0, 'Value cannot be negative'],
    },
    fuelConsumptionLiters: {
      type: Number,
      default: 0,
      min: [0, 'Fuel consumption cannot be negative'],
    },
    distanceTravelledKm: {
      type: Number,
      default: 0,
      min: [0, 'Distance travelled cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per category and date
reportMetricSchema.index({ category: 1, date: 1 });

module.exports = mongoose.model('ReportMetric', reportMetricSchema);

