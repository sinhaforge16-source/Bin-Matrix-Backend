const ChatMessage = require('../models/ChatMessage');

// @desc    Get all chat threads (user conversations with latest message & status)
// @route   GET /api/chat/threads
// @access  Public
const getChatThreads = async (req, res, next) => {
  try {
    // Aggregate by userId to get the latest message per user
    const threadsAgg = await ChatMessage.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$userId',
          latestMessage: { $first: '$$ROOT' },
          totalMessages: { $sum: 1 },
        },
      },
      { $sort: { 'latestMessage.timestamp': -1 } },
    ]);

    const threads = threadsAgg.map((item) => {
      const msg = item.latestMessage;
      return {
        userId: item._id,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        lastMessage: msg.messageText || (msg.imageAttachment ? '[Image attached]' : '[Location shared]'),
        timestamp: msg.timestamp,
        timeString: msg.timeString,
        status: msg.status,
        isOnline: msg.isOnline || false,
        totalMessages: item.totalMessages,
      };
    });

    res.json({
      success: true,
      count: threads.length,
      data: threads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full message history with a specific user
// @route   GET /api/chat/messages/:userId
// @access  Public
const getChatMessagesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { userId: new RegExp(`^${userId}$`, 'i') },
        { senderName: new RegExp(`^${userId}$`, 'i') },
      ],
    }).sort('timestamp');

    res.json({
      success: true,
      userId,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message, image, or location pin
// @route   POST /api/chat/messages
// @access  Public
const sendChatMessage = async (req, res, next) => {
  try {
    const {
      userId,
      senderName,
      senderAvatar,
      senderRole = 'user',
      messageText,
      imageAttachment,
      mapLocationPin,
      status = 'sent',
      timeString,
      isOnline,
    } = req.body;

    if (!userId || !senderName) {
      return res.status(400).json({
        success: false,
        message: 'userId and senderName are required',
      });
    }

    const formatTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${hours}.${minutes} ${ampm}`;
    };

    const newMsg = await ChatMessage.create({
      userId,
      senderName,
      senderAvatar: senderAvatar || '',
      senderRole,
      messageText: messageText || '',
      imageAttachment: imageAttachment || null,
      mapLocationPin: mapLocationPin || null,
      status,
      timeString: timeString || formatTime(),
      isOnline: isOnline !== undefined ? isOnline : true,
    });

    // Automated bot reply logic if triggered by a user
    let botReply = null;
    if (senderRole === 'user') {
      if (imageAttachment && (!mapLocationPin || !mapLocationPin.lat)) {
        botReply = await ChatMessage.create({
          userId,
          senderName: 'Bot',
          senderAvatar: '/avatars/bot.png',
          senderRole: 'bot',
          messageText: 'Sir, please send your current location',
          timeString: formatTime(),
          status: 'read',
          isOnline: true,
        });
      } else if (mapLocationPin && mapLocationPin.lat) {
        botReply = await ChatMessage.create({
          userId,
          senderName: 'Bot',
          senderAvatar: '/avatars/bot.png',
          senderRole: 'bot',
          messageText: 'Location received. Our waste collection vehicle has been dispatched.',
          timeString: formatTime(),
          status: 'read',
          isOnline: true,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: newMsg,
      botReply,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve reported chatbot bin coordinates for the Chat Map view (Chat map.png)
// @route   GET /api/chat/map-pins
// @access  Public
const getChatMapPins = async (req, res, next) => {
  try {
    const messagesWithPins = await ChatMessage.find({
      'mapLocationPin.lat': { $exists: true, $ne: null },
      'mapLocationPin.lng': { $exists: true, $ne: null },
    }).sort('-timestamp');

    const mapPins = messagesWithPins.map((msg, idx) => ({
      pinId: `PIN-${msg._id.toString().substring(18, 24).toUpperCase()}`,
      messageId: msg._id,
      userId: msg.userId,
      reportedBy: msg.senderName,
      latitude: msg.mapLocationPin.lat,
      longitude: msg.mapLocationPin.lng,
      mapUrl: msg.mapLocationPin.url || `https://maps.google.com/?q=${msg.mapLocationPin.lat},${msg.mapLocationPin.lng}`,
      address: msg.mapLocationPin.address || 'Reported Overflow Location',
      imageAttachment: msg.imageAttachment,
      reportedAt: msg.timestamp,
      timeString: msg.timeString,
      status: 'Reported',
    }));

    res.json({
      success: true,
      count: mapPins.length,
      data: mapPins,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatThreads,
  getChatMessagesByUserId,
  sendChatMessage,
  getChatMapPins,
};

