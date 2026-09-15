const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

// All notification endpoints require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

module.exports = router;
