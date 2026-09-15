const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../controllers/knowledgeController');

// All knowledgebase endpoints require authentication
router.use(authenticateToken);

// Fetch educational guides and FAQs (Accessible to all authenticated users)
router.get('/articles', getArticles);
router.get('/articles/:id', getArticleById);

// Article Authoring & Editing - Admin Only
router.post('/articles', authorizeRoles('ADMIN'), createArticle);
router.put('/articles/:id', authorizeRoles('ADMIN'), updateArticle);
router.delete('/articles/:id', authorizeRoles('ADMIN'), deleteArticle);

module.exports = router;
