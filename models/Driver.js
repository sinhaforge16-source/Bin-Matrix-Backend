const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Driver category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste'],
        message: '{VALUE} is not a valid category',
      },
    },
    isPresentToday: {
      type: Boolean,
      default: true,
    },
    isAllocated: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '+94 123 456 789',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'driver@binmatrix.com',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);

