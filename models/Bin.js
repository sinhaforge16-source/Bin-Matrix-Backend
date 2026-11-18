const mongoose = require('mongoose');

const binSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: [true, 'Bin ID is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Waste category is required'],
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
    fillLevel: {
      type: Number,
      required: true,
      min: [0, 'Fill level cannot be less than 0'],
      max: [100, 'Fill level cannot exceed 100'],
      default: 0,
    },
    batteryLevel: {
      type: Number,
      required: true,
      min: [0, 'Battery level cannot be less than 0'],
      max: [100, 'Battery level cannot exceed 100'],
      default: 100,
    },
    location: {
      type: String,
      required: [true, 'Location description is required'],
      default: 'Galle Rd, Dehiwala-Mount Lavinia',
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for capacity classification as shown in Bin Monitoring UI
binSchema.virtual('capacityStatus').get(function () {
  if (this.fillLevel >= 90) return 'Overflowing';
  if (this.fillLevel >= 75) return 'Almost Full';
  return 'Normal';
});

binSchema.set('toJSON', { virtuals: true });
binSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bin', binSchema);

