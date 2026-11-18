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
    capacityStatus: {
      type: String,
      required: true,
      enum: {
        values: ['Normal', 'Almost Full', 'Overflowing'],
        message: '{VALUE} is not a valid capacity status',
      },
      default: 'Normal',
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      required: [true, 'Location description is required'],
      default: 'Galle Rd, Dehiwala-Mount Lavinia',
    },
    latitude: {
      type: Number,
      required: false,
    },
    longitude: {
      type: Number,
      required: false,
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

// Auto-derive capacityStatus based on fillLevel if not explicitly assigned
binSchema.pre('validate', function () {
  if (this.fillLevel !== undefined && !this.isModified('capacityStatus') && this.isNew) {
    if (this.fillLevel >= 90) {
      this.capacityStatus = 'Overflowing';
    } else if (this.fillLevel >= 75) {
      this.capacityStatus = 'Almost Full';
    } else {
      this.capacityStatus = 'Normal';
    }
  }
});

module.exports = mongoose.model('Bin', binSchema);
