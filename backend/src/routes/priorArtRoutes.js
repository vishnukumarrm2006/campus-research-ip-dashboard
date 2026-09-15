const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  executeSearch,
  getSavedCitations,
  bookmarkCitation,
  deleteSavedCitation,
} = require('../controllers/priorArtController');

// All prior-art endpoints require authentication
router.use(authenticateToken);

// Execute Prior-Art Search
router.post('/search', executeSearch);

// Fetch saved citations for a project
router.get('/saved/:projectId', getSavedCitations);

// Bookmark citation for a project
router.post('/bookmark', bookmarkCitation);

// Delete saved citation
router.delete('/saved/:citationId', deleteSavedCitation);

module.exports = router;
