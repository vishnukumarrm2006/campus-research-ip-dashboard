const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  getSystemStats,
} = require('../controllers/adminController');

// All admin routes require token authentication and ADMIN role privilege
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.get('/system-stats', getSystemStats);

module.exports = router;
