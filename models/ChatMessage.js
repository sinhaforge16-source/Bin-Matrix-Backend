const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID or identifier is required to thread conversations'],
      index: true,
      trim: true,
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    senderAvatar: {
      type: String,
      default: '',
    },
    senderRole: {
      type: String,
      enum: ['user', 'bot', 'admin'],
      default: 'user',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    timeString: {
      type: String,
      default: '',
    },
    messageText: {
      type: String,
      default: '',
      trim: true,
    },
    imageAttachment: {
      type: String,
      default: null,
    },
    mapLocationPin: {
      lat: { type: Number },
      lng: { type: Number },
      url: { type: String },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'read',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ userId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
