const mongoose = require('mongoose');

const appUserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      default: 's@gmail.com',
    },
    assignedBinId: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Organic Waste',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Online',
    },
    lastUpdated: {
      type: String,
      default: 'Just now',
    },
    percentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    location: {
      type: String,
      default: 'Galle Rd',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

appUserSchema.index({ category: 1, userId: 1 });

module.exports = mongoose.model('AppUser', appUserSchema);

