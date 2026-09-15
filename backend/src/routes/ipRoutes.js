const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getIpProjectQueue,
  getIpDossier,
  updateIpStatus,
  getIpHistory,
} = require('../controllers/ipController');

// All IP endpoints require authentication
router.use(authenticateToken);

// IP Queue - Accessible to IP_COORDINATOR and ADMIN
router.get('/projects', authorizeRoles('IP_COORDINATOR', 'ADMIN'), getIpProjectQueue);

// Full IP Dossier - Accessible to IP_COORDINATOR, ADMIN, FACULTY, STUDENT
router.get('/projects/:projectId', getIpDossier);

// Update 10-Stage IP Filing Status - Accessible to IP_COORDINATOR and ADMIN
router.post('/projects/:projectId/status', authorizeRoles('IP_COORDINATOR', 'ADMIN'), updateIpStatus);

// IP Status History Timeline - Accessible to authenticated users
router.get('/projects/:projectId/history', getIpHistory);

module.exports = router;
