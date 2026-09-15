const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Project Document Repository Routes
router.get('/projects/:projectId/documents', authenticateToken, documentController.getProjectDocuments);
router.post('/projects/:projectId/documents', authenticateToken, documentController.uploadDocument);

// Single Document Stream / Download & Delete Routes
router.get('/documents/:id/download', authenticateToken, documentController.downloadDocument);
router.delete('/documents/:id', authenticateToken, documentController.deleteDocument);

module.exports = router;
