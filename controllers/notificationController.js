const Notification = require('../models/Notification');

// @desc    Get notifications with category filtering (All, Routes, Trucks, Drivers, Bins)
// @route   GET /api/notifications
// @access  Public
const getNotifications = async (req, res, next) => {
  try {
    const { category, isRead } = req.query;
    const query = {};

    if (category && category.toLowerCase() !== 'all') {
      const catCapitalized =
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      query.category = new RegExp(`^${catCapitalized}$`, 'i');
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true' || isRead === true;
    }

    const notifications = await Notification.find(query).sort('-timestamp');
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      category: category || 'All',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Public
const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Public
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Public
const createNotification = async (req, res, next) => {
  try {
    const {
      category,
      message,
      actionType,
      targetId,
      actionLabel,
      timeAgo,
      isRead,
    } = req.body;

    const notification = await Notification.create({
      category,
      message,
      actionType: actionType || 'None',
      targetId: targetId || '',
      actionLabel: actionLabel || '',
      timeAgo: timeAgo || 'Just now',
      isRead: isRead || false,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
};
