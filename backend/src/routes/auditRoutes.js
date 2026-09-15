const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

// All audit log endpoints require authentication & Admin role
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;
