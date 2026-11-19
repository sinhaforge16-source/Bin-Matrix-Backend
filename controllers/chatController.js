const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const telegramService = require('../services/telegramService');

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
        id: `th-${item._id}`,
        userId: item._id,
        senderName: msg.senderName,
        name: msg.senderName,
        senderAvatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        avatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        lastMessage: msg.messageText || (msg.imageAttachment ? '[Garbage Photo]' : '[Location Pin]'),
        timestamp: msg.timestamp,
        timeString: msg.timeString,
        status: msg.status,
        isOnline: msg.isOnline || false,
        totalMessages: item.totalMessages,
        channel: msg.channel || 'mobile_app',
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

    const formattedMessages = messages.map((m) => ({
      id: m._id,
      _id: m._id,
      userId: m.userId,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      senderRole: m.senderRole || (m.senderName === 'Bot' ? 'bot' : 'user'),
      channel: m.channel,
      messageText: m.messageText,
      imageAttachment: m.imageAttachment,
      locationUrl: m.mapLocationPin?.url,
      locationName: m.mapLocationPin?.address,
      coordinates:
        m.mapLocationPin?.lat !== undefined && m.mapLocationPin?.lng !== undefined
          ? [m.mapLocationPin.lat, m.mapLocationPin.lng]
          : null,
      mapLocationPin: m.mapLocationPin,
      isLocationSaved: Boolean(m.isLocationSaved || m.mapLocationPin?.isSaved),
      timeString: m.timeString,
      status: m.status || 'read',
      timestamp: m.timestamp,
    }));

    res.json({
      success: true,
      userId,
      count: formattedMessages.length,
      data: formattedMessages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message, image, or location pin (mobile app or dashboard)
// @route   POST /api/chat/messages
// @access  Public
const sendChatMessage = async (req, res, next) => {
  try {
    const {
      userId,
      senderName,
      senderAvatar,
      senderRole = 'user',
      channel = 'mobile_app',
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

    // Format map location pin if coordinates provided
    let formattedPin = null;
    const hasPinCoords =
      mapLocationPin &&
      (mapLocationPin.lat !== undefined || mapLocationPin.latitude !== undefined) &&
      (mapLocationPin.lat !== null || mapLocationPin.latitude !== null);

    if (hasPinCoords) {
      const lat = Number(mapLocationPin.lat ?? mapLocationPin.latitude);
      const lng = Number(mapLocationPin.lng ?? mapLocationPin.longitude);
      formattedPin = {
        lat,
        lng,
        address: mapLocationPin.address || 'Reported Overflow Location',
        url: mapLocationPin.url || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        embedUrl:
          mapLocationPin.embedUrl ||
          `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`,
        isSaved: false,
      };
    }

    const newMsg = await ChatMessage.create({
      userId,
      senderName,
      senderAvatar: senderAvatar || '',
      senderRole,
      channel,
      messageText: messageText || '',
      imageAttachment: imageAttachment || null,
      mapLocationPin: formattedPin,
      status,
      timeString: timeString || formatTime(),
      isOnline: isOnline !== undefined ? isOnline : true,
    });

    // Automated bot reply logic whenever a mobile app or portal user sends a message
    let botReply = null;
    if (senderRole === 'user') {
      if (!formattedPin) {
        // Citizen sent a garbage image or message without location coordinates ->
        // Bot automatically asks: "Sir, please send your current location"
        botReply = await ChatMessage.create({
          userId,
          senderName: 'Bot',
          senderAvatar: '/avatars/bot.png',
          senderRole: 'bot',
          channel,
          messageText: 'Sir, please send your current location',
          timeString: formatTime(),
          status: 'read',
          isOnline: true,
        });
      } else {
        // Citizen sent their location coordinates ->
        // Bot acknowledges receipt & vehicle dispatch
        botReply = await ChatMessage.create({
          userId,
          senderName: 'Bot',
          senderAvatar: '/avatars/bot.png',
          senderRole: 'bot',
          channel,
          messageText: 'Location received. Our waste collection vehicle has been dispatched.',
          timeString: formatTime(),
          status: 'read',
          isOnline: true,
        });

        // Create alert notification for dispatch dashboard
        try {
          await Notification.create({
            category: 'Bins',
            message: `User ${senderName} (${userId}) reported garbage with location.`,
            actionType: 'Chat',
            targetId: userId,
            actionLabel: 'View Chat',
            timeAgo: 'Just now',
          });
        } catch (notifErr) {
          console.warn('[sendChatMessage] Notification creation error:', notifErr.message);
        }
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

// @desc    Operator manually saves a mobile citizen reported location to the collection route/map
// @route   POST /api/chat/save-location
// @access  Public
const saveReportedLocationManually = async (req, res, next) => {
  try {
    const {
      messageId,
      userId,
      senderName,
      latitude,
      longitude,
      address,
      imageAttachment,
    } = req.body;

    const formatTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${hours}.${minutes} ${ampm}`;
    };

    let targetMessage = null;
    if (messageId) {
      targetMessage = await ChatMessage.findById(messageId);
    } else if (userId) {
      targetMessage = await ChatMessage.findOne({
        userId,
        $or: [
          { 'mapLocationPin.lat': { $exists: true, $ne: null } },
          { 'mapLocationPin.latitude': { $exists: true, $ne: null } },
        ],
      }).sort('-timestamp');
    }

    const lat = Number(latitude ?? targetMessage?.mapLocationPin?.lat ?? 6.9388);
    const lng = Number(longitude ?? targetMessage?.mapLocationPin?.lng ?? 80.0160);
    const resolvedAddress =
      address || targetMessage?.mapLocationPin?.address || 'Citizen Reported Waste Point';

    // Update target message record to mark location as saved
    if (targetMessage) {
      targetMessage.isLocationSaved = true;
      if (!targetMessage.mapLocationPin) {
        targetMessage.mapLocationPin = {};
      }
      targetMessage.mapLocationPin.lat = lat;
      targetMessage.mapLocationPin.lng = lng;
      targetMessage.mapLocationPin.address = resolvedAddress;
      targetMessage.mapLocationPin.isSaved = true;
      targetMessage.mapLocationPin.savedAt = new Date();
      targetMessage.mapLocationPin.savedBy = 'Municipal Operator';
      await targetMessage.save();
    }

    // Connect with Mobile: Insert operator confirmation message sent to the mobile user
    const confirmationText =
      'Your reported location has been verified and saved to the collection schedule by the municipal operator.';

    const confirmationMsg = await ChatMessage.create({
      userId: userId || targetMessage?.userId || 'mobile_user',
      senderName: 'Bin Matrix Operator',
      senderAvatar: '/avatars/operator.png',
      senderRole: 'operator',
      channel: targetMessage?.channel || 'mobile_app',
      messageText: confirmationText,
      timeString: formatTime(),
      status: 'delivered',
      isOnline: true,
    });

    // If citizen originally messaged through Telegram, send them confirmation on Telegram as well
    if (targetMessage?.telegramChatId || targetMessage?.channel === 'telegram') {
      const tgChatId = targetMessage.telegramChatId || targetMessage.userId.replace('tg_', '');
      await telegramService.sendTelegramMessage(
        tgChatId,
        `✅ <b>Report Verified & Saved!</b>\nThe municipal operator has manually verified your location (<i>${resolvedAddress}</i>) and added it to today's active collection route.`
      );
    }

    // Create system notification for web dashboard
    const userDisplayName = senderName || targetMessage?.senderName || userId || 'Mobile Citizen';
    await Notification.create({
      category: 'Bins',
      message: `Operator saved location reported by ${userDisplayName} (${resolvedAddress}) to the collection route.`,
      actionType: 'Bin',
      targetId: userId || 'PIN-SAVED',
      actionLabel: 'View on Map',
      timeAgo: 'Just now',
    });

    // Saved pin structure
    const pinId = targetMessage
      ? `PIN-${targetMessage._id.toString().substring(18, 24).toUpperCase()}`
      : `PIN-${Date.now().toString().slice(-4)}`;

    const savedPin = {
      id: pinId,
      pinId,
      binId: pinId,
      userId: userId || targetMessage?.userId,
      reportedBy: userDisplayName,
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      address: resolvedAddress,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      embedUrl: `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`,
      imageAttachment: imageAttachment || targetMessage?.imageAttachment || null,
      status: 'Saved to Route',
      isSaved: true,
      savedAt: new Date(),
    };

    res.json({
      success: true,
      message: 'Location manually saved and connected to mobile user conversation',
      data: savedPin,
      confirmationMessage: confirmationMsg,
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
      $or: [
        { 'mapLocationPin.lat': { $exists: true, $ne: null } },
        { 'mapLocationPin.latitude': { $exists: true, $ne: null } },
      ],
    }).sort('-timestamp');

    const mapPins = messagesWithPins.map((msg) => {
      const lat = Number(msg.mapLocationPin?.lat ?? msg.mapLocationPin?.latitude);
      const lng = Number(msg.mapLocationPin?.lng ?? msg.mapLocationPin?.longitude);
      const pinId = `PIN-${msg._id.toString().substring(18, 24).toUpperCase()}`;
      const isSaved = Boolean(msg.isLocationSaved || msg.mapLocationPin?.isSaved);

      return {
        id: pinId,
        pinId,
        binId: pinId,
        messageId: msg._id,
        userId: msg.userId,
        reportedBy: msg.senderName,
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        mapUrl:
          msg.mapLocationPin?.url ||
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        embedUrl:
          msg.mapLocationPin?.embedUrl ||
          `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`,
        address: msg.mapLocationPin?.address || 'Reported Overflow Location',
        area: msg.mapLocationPin?.address || 'Reported Overflow Location',
        imageAttachment: msg.imageAttachment,
        reportedAt: msg.timestamp,
        timeString: msg.timeString,
        status: isSaved ? 'Saved to Route' : 'Reported',
        isSaved,
        capacityStatus: 'Overflowing',
      };
    });

    res.json({
      success: true,
      count: mapPins.length,
      data: mapPins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle incoming Telegram update webhook
// @route   POST /api/chat/telegram-webhook
// @access  Public
const handleTelegramWebhook = async (req, res, next) => {
  try {
    const result = await telegramService.handleTelegramUpdate(req.body);
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Telegram Bot integration status
// @route   GET /api/chat/telegram-status
// @access  Public
const getTelegramStatus = async (req, res, next) => {
  try {
    const isConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    res.json({
      success: true,
      isConfigured,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'BinMatrixBot',
      webhookUrl: '/api/chat/telegram-webhook',
      instructions: isConfigured
        ? 'Telegram bot token is active.'
        : 'Set TELEGRAM_BOT_TOKEN in .env to connect your live Telegram bot.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatThreads,
  getChatMessagesByUserId,
  sendChatMessage,
  saveReportedLocationManually,
  getChatMapPins,
  handleTelegramWebhook,
  getTelegramStatus,
};
