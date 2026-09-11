const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Student-Only Route
router.get('/student-only', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized Access: Welcome to Student API Portal',
    user: req.user,
  });
});

// Faculty-Only Route
router.get('/faculty-only', authenticateToken, authorizeRoles('FACULTY'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized Access: Welcome to Faculty Review Portal',
    user: req.user,
  });
});

// IP Coordinator-Only Route
router.get('/ip-only', authenticateToken, authorizeRoles('IP_COORDINATOR'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized Access: Welcome to Institutional IP Filing Dashboard',
    user: req.user,
  });
});

// Admin-Only Route
router.get('/admin-only', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized Access: Welcome to System Administration Console',
    user: req.user,
  });
});

// Multi-Role Route (Faculty OR Admin)
router.get('/faculty-or-admin', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Authorized Access: Shared Faculty & Admin Resource',
    user: req.user,
  });
});

module.exports = router;
