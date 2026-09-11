const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public/Authenticated Domain Viewing Routes
router.get('/', authenticateToken, domainController.getDomains);
router.get('/:id', authenticateToken, domainController.getDomainById);

// Admin-Only Domain Mutation Routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), domainController.createDomain);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), domainController.updateDomain);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), domainController.deleteDomain);

module.exports = router;
