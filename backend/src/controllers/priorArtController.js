const { mockStore } = require('../config/db');
const priorArtService = require('../services/priorArtService');

/**
 * Controller: Execute Prior-Art Literature & Patent Search
 * POST /api/prior-art/search
 */
const executeSearch = async (req, res) => {
  try {
    const { query, domain_name, source_platform, min_similarity, limit } = req.body;

    const results = await priorArtService.searchPriorArt({
      query,
      domain_name,
      source_platform,
      min_similarity,
      limit,
    });

    return res.json({
      success: true,
      count: results.length,
      query: query || '',
      results,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Prior-art search failed: ' + error.message });
  }
};

/**
 * Controller: Fetch Saved Prior-Art Citations for a Project
 * GET /api/prior-art/saved/:projectId
 */
const getSavedCitations = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const citations = mockStore.saved_prior_art_citations
      .filter(c => c.project_id === projectId)
      .map(c => {
        const u = mockStore.users.find(usr => usr.id === c.bookmarked_by_user_id);
        return {
          ...c,
          bookmarked_by_name: u ? u.full_name : 'System User',
        };
      });

    return res.json({
      success: true,
      count: citations.length,
      citations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Bookmark/Save a Prior-Art Citation for a Project Disclosure
 * POST /api/prior-art/bookmark
 */
const bookmarkCitation = async (req, res) => {
  const {
    project_id,
    citation_title,
    source_platform,
    document_id,
    authors_assignees,
    publication_year,
    similarity_score,
    abstract_snippet,
    url,
    relevance_notes,
  } = req.body;

  const projectId = parseInt(project_id, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  if (!citation_title || !source_platform) {
    return res.status(400).json({ success: false, error: 'Citation title and source platform are required.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const citationId = mockStore.saved_prior_art_citations.length > 0
      ? Math.max(...mockStore.saved_prior_art_citations.map(c => c.id)) + 1 : 1;

    const newCitation = {
      id: citationId,
      project_id: projectId,
      bookmarked_by_user_id: req.user.id,
      source_platform,
      citation_title,
      document_id: document_id || 'N/A',
      authors_assignees: authors_assignees || 'Unknown',
      publication_year: parseInt(publication_year, 10) || new Date().getFullYear(),
      similarity_score: parseFloat(similarity_score) || 0.0,
      abstract_snippet: abstract_snippet || '',
      url: url || '',
      relevance_notes: relevance_notes || 'Bookmarked during prior-art search.',
      created_at: new Date(),
    };

    mockStore.saved_prior_art_citations.push(newCitation);

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'BOOKMARK_PRIOR_ART',
      entity: 'PRIOR_ART_CITATION',
      entity_id: citationId,
      previous_value: null,
      new_value: { citation_title, document_id },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Prior-art citation successfully bookmarked and attached to project disclosure.',
      citation: newCitation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to bookmark citation: ' + error.message });
  }
};

/**
 * Controller: Delete a saved prior-art citation
 * DELETE /api/prior-art/saved/:citationId
 */
const deleteSavedCitation = async (req, res) => {
  const citationId = parseInt(req.params.citationId, 10);
  if (isNaN(citationId)) {
    return res.status(400).json({ success: false, error: 'Invalid citation ID.' });
  }

  try {
    const index = mockStore.saved_prior_art_citations.findIndex(c => c.id === citationId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Saved citation not found.' });
    }

    mockStore.saved_prior_art_citations.splice(index, 1);

    return res.json({
      success: true,
      message: 'Saved prior-art citation deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  executeSearch,
  getSavedCitations,
  bookmarkCitation,
  deleteSavedCitation,
};
