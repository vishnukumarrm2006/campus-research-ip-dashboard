const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Project Milestone Routes
router.get('/projects/:projectId/milestones', authenticateToken, milestoneController.getProjectMilestones);
router.post('/projects/:projectId/milestones', authenticateToken, milestoneController.createMilestone);
router.post('/projects/:projectId/recommend-ai', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), milestoneController.recommendForAiScreening);

// Milestone Action Routes
router.post('/milestones/:id/submit', authenticateToken, milestoneController.submitMilestoneProgress);
router.post('/milestones/:id/feedback', authenticateToken, authorizeRoles('FACULTY', 'ADMIN'), milestoneController.submitFacultyFeedback);

module.exports = router;
