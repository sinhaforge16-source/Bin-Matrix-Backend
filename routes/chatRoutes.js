const express = require('express');
const router = express.Router();
const {
  getChatThreads,
  getChatMessagesByUserId,
  sendChatMessage,
  getChatMapPins,
} = require('../controllers/chatController');

// Threads list
router.get('/threads', getChatThreads);

// Map pins of reported overflow locations
router.get('/map-pins', getChatMapPins);

// Send message
router.post('/messages', sendChatMessage);

// Messages by userId
router.get('/messages/:userId', getChatMessagesByUserId);

module.exports = router;
