const { mockStore } = require('../config/db');

/**
 * Controller: Get Notifications for Logged-In User
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const userNotifications = mockStore.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = userNotifications.filter(n => !n.is_read).length;

    return res.json({
      success: true,
      count: userNotifications.length,
      unread_count: unreadCount,
      notifications: userNotifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications: ' + error.message });
  }
};

/**
 * Controller: Mark Notification as Read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  const notificationId = parseInt(req.params.id, 10);
  if (isNaN(notificationId)) {
    return res.status(400).json({ success: false, error: 'Invalid notification ID.' });
  }

  try {
    const notification = mockStore.notifications.find(n => n.id === notificationId && n.user_id === req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    notification.is_read = true;

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Mark All Notifications as Read for User
 * POST /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    mockStore.notifications.forEach(n => {
      if (n.user_id === userId) {
        n.is_read = true;
      }
    });

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
