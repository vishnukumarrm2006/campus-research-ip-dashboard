const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Viewing Faculty & Domain Matching Routes
router.get('/', authenticateToken, facultyController.getAllFaculty);
router.get('/domain/:domainId', authenticateToken, facultyController.getFacultyByDomain);

// Admin-Only Faculty Mapping & Assignment Routes
router.post('/:id/domains', authenticateToken, authorizeRoles('ADMIN'), facultyController.updateFacultyDomains);
router.put('/:id/workload', authenticateToken, authorizeRoles('ADMIN'), facultyController.updateFacultyWorkload);
router.post('/assign-project', authenticateToken, authorizeRoles('ADMIN', 'FACULTY'), facultyController.assignFacultyToProject);

module.exports = router;
