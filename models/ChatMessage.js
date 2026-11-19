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
      enum: ['user', 'bot', 'admin', 'operator'],
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
      embedUrl: { type: String },
      address: { type: String, default: '' },
      isSaved: { type: Boolean, default: false },
      savedAt: { type: Date, default: null },
      savedBy: { type: String, default: null },
    },
    isLocationSaved: {
      type: Boolean,
      default: false,
    },
    channel: {
      type: String,
      enum: ['mobile_app', 'telegram', 'web'],
      default: 'mobile_app',
    },
    telegramChatId: {
      type: String,
      default: null,
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
