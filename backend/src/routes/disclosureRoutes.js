const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getDisclosure,
  saveDisclosure,
  exportDisclosure,
} = require('../controllers/disclosureController');

// All disclosure endpoints require authentication
router.use(authenticateToken);

// Fetch Invention Disclosure Form draft for a project
router.get('/project/:projectId', getDisclosure);

// Update/Save Invention Disclosure Form draft
router.put('/project/:projectId', saveDisclosure);

// Export compiled Invention Disclosure Form dossier
router.post('/project/:projectId/export', exportDisclosure);

module.exports = router;
