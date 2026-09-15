const { mockStore } = require('../config/db');

/**
 * Controller: Get IP Educational Guides & FAQ Articles
 * GET /api/knowledge/articles
 */
const getArticles = async (req, res) => {
  try {
    const { category, search } = req.query;

    let articles = [...mockStore.ip_awareness_content];

    // Filter published articles for non-admin users
    if (!req.user || req.user.role_name !== 'ADMIN') {
      articles = articles.filter(a => a.is_published);
    }

    // Filter by Category
    if (category && category !== 'ALL') {
      articles = articles.filter(a => a.category === category);
    }

    // Search query filter
    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.summary && a.summary.toLowerCase().includes(q)) ||
        (a.content_markdown && a.content_markdown.toLowerCase().includes(q))
      );
    }

    const categoriesList = [
      { key: 'ALL', label: 'All Educational Resources' },
      { key: 'IP_BASICS', label: 'IP & Patent Fundamentals' },
      { key: 'PATENT_WORKFLOW', label: 'Campus Patent Filing Workflow' },
      { key: 'PRIOR_ART_SEARCH', label: 'Prior-Art Search Guide' },
      { key: 'DISCLOSURE_GUIDE', label: 'Invention Disclosure Guide' },
      { key: 'COMMON_MISTAKES', label: 'Top 5 IP Mistakes to Avoid' },
      { key: 'FAQ', label: 'Frequently Asked Questions (FAQ)' },
    ];

    return res.json({
      success: true,
      count: articles.length,
      categories: categoriesList,
      articles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch knowledgebase articles: ' + error.message });
  }
};

/**
 * Controller: Get Single Article Details
 * GET /api/knowledge/articles/:id
 */
const getArticleById = async (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  if (isNaN(articleId)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  try {
    const article = mockStore.ip_awareness_content.find(a => a.id === articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    const author = mockStore.users.find(u => u.id === article.author_admin_id);

    return res.json({
      success: true,
      article: {
        ...article,
        author_name: author ? author.full_name : 'IP Cell Administrator',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Create New Educational Guide / FAQ Article (Admin Only)
 * POST /api/knowledge/articles
 */
const createArticle = async (req, res) => {
  const { title, category, summary, content_markdown, is_published, read_time_mins } = req.body;

  if (!title || !category || !content_markdown) {
    return res.status(400).json({
      success: false,
      error: 'Article title, category, and markdown content are required.',
    });
  }

  try {
    const articleId = mockStore.ip_awareness_content.length > 0
      ? Math.max(...mockStore.ip_awareness_content.map(a => a.id)) + 1 : 1;

    const newArticle = {
      id: articleId,
      title,
      category,
      summary: summary || title,
      content_markdown,
      author_admin_id: req.user.id,
      is_published: is_published !== undefined ? Boolean(is_published) : true,
      read_time_mins: parseInt(read_time_mins, 10) || 3,
      created_at: new Date(),
    };

    mockStore.ip_awareness_content.push(newArticle);

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'CREATE_KNOWLEDGE_ARTICLE',
      entity: 'IP_ARTICLE',
      entity_id: articleId,
      previous_value: null,
      new_value: { title, category },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'IP Educational Article published successfully.',
      article: newArticle,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create article: ' + error.message });
  }
};

/**
 * Controller: Update/Edit Educational Article (Admin Only)
 * PUT /api/knowledge/articles/:id
 */
const updateArticle = async (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  if (isNaN(articleId)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  const { title, category, summary, content_markdown, is_published, read_time_mins } = req.body;

  try {
    const index = mockStore.ip_awareness_content.findIndex(a => a.id === articleId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    mockStore.ip_awareness_content[index] = {
      ...mockStore.ip_awareness_content[index],
      title: title || mockStore.ip_awareness_content[index].title,
      category: category || mockStore.ip_awareness_content[index].category,
      summary: summary || mockStore.ip_awareness_content[index].summary,
      content_markdown: content_markdown || mockStore.ip_awareness_content[index].content_markdown,
      is_published: is_published !== undefined ? Boolean(is_published) : mockStore.ip_awareness_content[index].is_published,
      read_time_mins: read_time_mins || mockStore.ip_awareness_content[index].read_time_mins,
    };

    return res.json({
      success: true,
      message: 'IP Article updated successfully.',
      article: mockStore.ip_awareness_content[index],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Delete Article (Admin Only)
 * DELETE /api/knowledge/articles/:id
 */
const deleteArticle = async (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  if (isNaN(articleId)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  try {
    const index = mockStore.ip_awareness_content.findIndex(a => a.id === articleId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    mockStore.ip_awareness_content.splice(index, 1);

    return res.json({
      success: true,
      message: 'Article deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
};
