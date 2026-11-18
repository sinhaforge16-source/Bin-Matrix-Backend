const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true,
    },
    truckNumber: {
      type: String,
      trim: true,
    },
    gpsDeviceId: {
      type: String,
      trim: true,
      default: 'FG-001',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Plastic', 'Paper', 'Organic waste', 'Organic Waste', 'Chatbot'],
        message: '{VALUE} is not a valid category',
      },
      default: 'Organic Waste',
    },
    driver: {
      driverId: { type: String, trim: true },
      name: { type: String, trim: true },
      contactNumber: { type: String, trim: true },
    },
    routeCode: {
      type: String,
      trim: true,
      default: '2712-Owa-01',
    },
    startTime: {
      type: String,
      default: '8.00 am',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Online', 'Offline', 'Idle'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Online',
    },
    isIdle: {
      type: Boolean,
      default: false,
    },
    speedKmh: {
      type: Number,
      default: 0,
      min: [0, 'Speed cannot be negative'],
    },
    ignitionStatus: {
      type: String,
      enum: ['On', 'Off'],
      default: 'Off',
    },
    currentLocation: {
      type: String,
      default: 'Dehiwala-Mount Lavinia, Sri Lanka',
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
    todaySummary: {
      totalDistanceKm: { type: Number, default: 0 },
      activeTimeMinutes: { type: Number, default: 0 },
      idleTimeMinutes: { type: Number, default: 0 },
      offlineTimeMinutes: { type: Number, default: 0 },
    },
    routeProgress: {
      completedBins: { type: Number, default: 0 },
      pendingBins: { type: Number, default: 0 },
      missedBins: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 },
      routeCoordinates: [
        {
          lat: Number,
          lng: Number,
          segmentStatus: { type: String, default: 'Pending' },
        },
      ],
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

// Pre-save synchronization: ensure truckNumber defaults to vehicleId and isIdle syncs with status
truckSchema.pre('validate', function () {
  if (!this.truckNumber && this.vehicleId) {
    this.truckNumber = this.vehicleId;
  }
  if (!this.vehicleId && this.truckNumber) {
    this.vehicleId = this.truckNumber;
  }
  if (this.status === 'Idle') {
    this.isIdle = true;
  } else {
    this.isIdle = false;
  }
});

module.exports = mongoose.model('Truck', truckSchema);
