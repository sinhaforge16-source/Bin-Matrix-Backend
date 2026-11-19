const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');

// Formatter for timestamp strings e.g. "10.01 am"
const formatTimeString = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${hours}.${minutes} ${ampm}`;
};

/**
 * Send message to a Telegram chat via Telegram Bot API
 */
const sendTelegramMessage = async (chatId, text, replyMarkup = null) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[Telegram Service] No TELEGRAM_BOT_TOKEN configured in .env. Skipping external send.');
    return { ok: false, message: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Telegram Service] Error sending telegram message:', error.message);
    return { ok: false, error: error.message };
  }
};

/**
 * Handle incoming webhook update from Telegram
 * (Citizens reporting debris via Telegram bot)
 */
const handleTelegramUpdate = async (update) => {
  try {
    const message = update.message || update.edited_message || update.channel_post;
    if (!message) return { ok: true, ignored: true };

    const chatId = message.chat?.id;
    const from = message.from || {};
    const userId = `tg_${from.id || chatId}`;
    const senderName =
      from.first_name && from.last_name
        ? `${from.first_name} ${from.last_name}`
        : from.first_name || from.username || `Telegram User (${chatId})`;

    const timeString = formatTimeString();

    // Case 1: Citizen shared GPS Location on Telegram
    if (message.location) {
      const { latitude, longitude } = message.location;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=15&output=embed`;

      // Save Citizen's location message
      const citizenMsg = await ChatMessage.create({
        userId,
        senderName,
        senderRole: 'user',
        channel: 'telegram',
        telegramChatId: String(chatId),
        messageText: googleMapsUrl,
        mapLocationPin: {
          lat: latitude,
          lng: longitude,
          url: googleMapsUrl,
          embedUrl,
          address: 'Telegram Reported GPS Location',
        },
        timeString,
        status: 'delivered',
        isOnline: true,
      });

      // Bot automatically replies: Location received
      const botReplyText =
        'Location received. Our waste collection vehicle has been dispatched.';

      const botReplyMsg = await ChatMessage.create({
        userId,
        senderName: 'Bot',
        senderAvatar: '/avatars/bot.png',
        senderRole: 'bot',
        channel: 'telegram',
        telegramChatId: String(chatId),
        messageText: botReplyText,
        timeString,
        status: 'read',
        isOnline: true,
      });

      // Send bot reply back to citizen on Telegram
      await sendTelegramMessage(
        chatId,
        `✅ <b>Location received!</b>\nOur municipal waste collection vehicle has been dispatched to your coordinates.\n\n📍 <i>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</i>`
      );

      // Create system notification for web dashboard
      await Notification.create({
        category: 'Bins',
        message: `User ${senderName} (${userId}) reported garbage with location via Telegram.`,
        actionType: 'Chat',
        targetId: userId,
        actionLabel: 'View Chat',
        timeAgo: 'Just now',
      });

      return {
        ok: true,
        type: 'location_received',
        citizenMsg,
        botReplyMsg,
      };
    }

    // Case 2: Citizen sent Text or Photo (Without location)
    let messageText = message.text || message.caption || '';
    let imageAttachment = null;

    if (message.photo && message.photo.length > 0) {
      const bestPhoto = message.photo[message.photo.length - 1];
      imageAttachment = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${bestPhoto.file_id}`;
    }

    // Save Citizen's message in MongoDB
    const citizenMsg = await ChatMessage.create({
      userId,
      senderName,
      senderRole: 'user',
      channel: 'telegram',
      telegramChatId: String(chatId),
      messageText: messageText || (imageAttachment ? '[Photo sent via Telegram]' : 'Hello'),
      imageAttachment,
      timeString,
      status: 'delivered',
      isOnline: true,
    });

    // Bot automatically replies asking for location!
    const botReplyText = 'Sir, please send your current location';

    const botReplyMsg = await ChatMessage.create({
      userId,
      senderName: 'Bot',
      senderAvatar: '/avatars/bot.png',
      senderRole: 'bot',
      channel: 'telegram',
      telegramChatId: String(chatId),
      messageText: botReplyText,
      timeString,
      status: 'read',
      isOnline: true,
    });

    // Send Telegram reply with Location Request button
    await sendTelegramMessage(
      chatId,
      `Hello ${from.first_name || 'Sir'}! 👋\n\n<b>Sir, please send your current location</b> so our collection team can locate the exact spot.`,
      {
        keyboard: [
          [{ text: '📍 Share Current Location', request_location: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    );

    return {
      ok: true,
      type: 'location_requested',
      citizenMsg,
      botReplyMsg,
    };
  } catch (error) {
    console.error('[Telegram Service] Error handling Telegram update:', error);
    return { ok: false, error: error.message };
  }
};

module.exports = {
  sendTelegramMessage,
  handleTelegramUpdate,
};
