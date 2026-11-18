const mongoose = require('mongoose');

const routePlanSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste', 'Organic Waste', 'Chatbot'],
        message: '{VALUE} is not a valid category',
      },
      default: 'Organic Waste',
    },
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      default: '2712-Ewa-01',
      trim: true,
    },
    steps: [
      {
        stepNumber: {
          type: Number,
          required: true,
        },
        stepLabel: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['Active', 'Pending', 'Completed'],
          default: 'Pending',
        },
        description: {
          type: String,
          default: '',
        },
        coordinates: [
          {
            lat: Number,
            lng: Number,
            stopName: String,
          },
        ],
      },
    ],
    isOptimized: {
      type: Boolean,
      default: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

routePlanSchema.index({ category: 1, routeName: 1 });

module.exports = mongoose.model('RoutePlan', routePlanSchema);
