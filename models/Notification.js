const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Notification category is required'],
      enum: {
        values: ['Routes', 'Trucks', 'Drivers', 'Bins'],
        message: '{VALUE} is not a valid category',
      },
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    timeAgo: {
      type: String,
      default: 'Just now',
    },
    actionType: {
      type: String,
      enum: ['Truck', 'Driver', 'Bin', 'Chat', 'Route', 'None'],
      default: 'None',
    },
    targetId: {
      type: String,
      default: '',
    },
    actionLabel: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ category: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

