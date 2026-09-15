const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getSummaryMetrics,
  getDomainAnalytics,
  getFilingConversionFunnel,
  exportExecutiveReport,
} = require('../controllers/analyticsController');

// All analytics endpoints require authentication
router.use(authenticateToken);

// Summary KPI Metrics - Accessible to ADMIN, IP_COORDINATOR, FACULTY
router.get('/summary', authorizeRoles('ADMIN', 'IP_COORDINATOR', 'FACULTY', 'STUDENT'), getSummaryMetrics);

// Domain Project Distribution & Capacity Analytics
router.get('/domains', authorizeRoles('ADMIN', 'IP_COORDINATOR', 'FACULTY', 'STUDENT'), getDomainAnalytics);

// Patent Filing Conversion Funnel
router.get('/filing-conversion', authorizeRoles('ADMIN', 'IP_COORDINATOR', 'FACULTY', 'STUDENT'), getFilingConversionFunnel);

// Export Executive Research & IP Performance Report (CSV / JSON)
router.get('/export', authorizeRoles('ADMIN', 'IP_COORDINATOR', 'FACULTY'), exportExecutiveReport);

module.exports = router;
