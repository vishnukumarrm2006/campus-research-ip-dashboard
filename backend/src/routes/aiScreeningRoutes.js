const express = require('express');
const router = express.Router();
const aiScreeningController = require('../controllers/aiScreeningController');
const { authenticateToken } = require('../middleware/authMiddleware');

// AI Screening Routes
router.get('/projects/:projectId/ai-screening', authenticateToken, aiScreeningController.getAiReport);
router.post('/projects/:projectId/ai-screening', authenticateToken, aiScreeningController.triggerAiScreening);

module.exports = router;
