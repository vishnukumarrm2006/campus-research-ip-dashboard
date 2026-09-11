const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Student Search Utility Route
router.get('/students/search', authenticateToken, projectController.searchStudents);

// Project Directory & Detail Routes
router.get('/', authenticateToken, projectController.getProjects);
router.get('/:id', authenticateToken, projectController.getProjectById);

// Student Project Mutation Routes
router.post('/', authenticateToken, authorizeRoles('STUDENT', 'ADMIN'), projectController.createProject);
router.put('/:id', authenticateToken, projectController.updateProject);
router.post('/:id/submit', authenticateToken, projectController.submitProject);

// Team Member Management Routes
router.post('/:id/members', authenticateToken, projectController.addTeamMember);
router.delete('/:id/members/:studentId', authenticateToken, projectController.removeTeamMember);

module.exports = router;
