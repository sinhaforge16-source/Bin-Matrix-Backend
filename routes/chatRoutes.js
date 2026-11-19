const express = require('express');
const router = express.Router();
const {
  getChatThreads,
  getChatMessagesByUserId,
  sendChatMessage,
  saveReportedLocationManually,
  getChatMapPins,
  handleTelegramWebhook,
  getTelegramStatus,
} = require('../controllers/chatController');

// Threads list
router.get('/threads', getChatThreads);

// Map pins of reported overflow locations
router.get('/map-pins', getChatMapPins);

// Send message (from mobile app, telegram or web)
router.post('/messages', sendChatMessage);

// Messages by userId
router.get('/messages/:userId', getChatMessagesByUserId);

// Operator manually saves mobile citizen reported location to route / map
router.post('/save-location', saveReportedLocationManually);

// Telegram bot webhook & status
router.post('/telegram-webhook', handleTelegramWebhook);
router.get('/telegram-status', getTelegramStatus);

module.exports = router;
