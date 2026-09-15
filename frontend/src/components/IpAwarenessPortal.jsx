import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { key: 'ALL', label: 'All Resources' },
  { key: 'IP_BASICS', label: 'IP & Patent Basics' },
  { key: 'PATENT_WORKFLOW', label: 'Campus Filing Workflow' },
  { key: 'PRIOR_ART_SEARCH', label: 'Prior-Art Search Guide' },
  { key: 'DISCLOSURE_GUIDE', label: 'Invention Disclosure Guide' },
  { key: 'COMMON_MISTAKES', label: 'Top 5 IP Pitfalls' },
  { key: 'FAQ', label: 'FAQs & Q&A' },
];

const IpAwarenessPortal = ({ token, user }) => {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reader Modal State
  const [activeArticle, setActiveArticle] = useState(null);

  // Admin Authoring Modal State
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('IP_BASICS');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newReadTime, setNewReadTime] = useState('4');
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      let queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'ALL') {
        queryParams.append('category', selectedCategory);
      }

      const res = await fetch(`/api/knowledge/articles?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setArticles(data.articles || []);
      } else {
        setError(data.error || 'Failed to load knowledgebase articles.');
      }
    } catch (err) {
      setError('Connection error while fetching knowledgebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and article markdown content are required.');
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/knowledge/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          summary: newSummary || newTitle,
          content_markdown: newContent,
          read_time_mins: newReadTime,
          is_published: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('New IP Educational Guide published successfully!');
        setShowAuthorModal(false);
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
        fetchArticles();
      } else {
        setError(data.error || 'Failed to publish article.');
      }
    } catch (err) {
      setError('Connection error while creating article.');
    } finally {
      setPublishing(false);
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'IP_BASICS': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PATENT_WORKFLOW': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'PRIOR_ART_SEARCH': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'DISCLOSURE_GUIDE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'COMMON_MISTAKES': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'FAQ': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredArticles = articles.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.summary && a.summary.toLowerCase().includes(q)) ||
      (a.content_markdown && a.content_markdown.toLowerCase().includes(q))
    );
  });

  const faqArticles = filteredArticles.filter(a => a.category === 'FAQ');
  const guideArticles = filteredArticles.filter(a => a.category !== 'FAQ');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">
              <span>🎓 Campus IP Cell Knowledgebase</span>
              <span>•</span>
              <span>Educational Hub & FAQs</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">IP Awareness, Educational Portal & FAQ Desk</h1>
            <p className="text-slate-400 text-sm mt-1">
              Master patent fundamentals, 10-stage filing workflows, prior-art search techniques, and invention disclosure drafting.
            </p>
          </div>

          {user?.role_name === 'ADMIN' && (
            <button
              onClick={() => setShowAuthorModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <span>✍️ Author New IP Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search guides, FAQs, or filing policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder-slate-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedCategory === cat.key
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex justify-between items-center">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Content Grid & FAQs */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading IP educational articles & FAQs...</div>
      ) : (
        <div className="space-y-8">

          {/* Section 1: Featured Educational Guides */}
          {guideArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>📚 Campus IP Educational Guides</span>
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-purple-300 rounded-full">{guideArticles.length}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guideArticles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border uppercase ${getCategoryBadge(art.category)}`}>
                          {art.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">{art.read_time_mins || 3} min read</span>
                      </div>
                      <h3 className="text-base font-bold text-white hover:text-purple-300 transition line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveArticle(art)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Read Full Guide 📖</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Searchable Interactive FAQ Accordion */}
          {faqArticles.length > 0 && (
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>❓ Frequently Asked Questions (Campus IP Q&A)</span>
                <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 rounded-full">{faqArticles.length}</span>
              </h2>

              <div className="space-y-3">
                {faqArticles.map((faq) => (
                  <div key={faq.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <span>💡</span>
                      <span>{faq.title}</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {faq.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Full Guide Markdown Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border uppercase ${getCategoryBadge(activeArticle.category)}`}>
                  {activeArticle.category.replace(/_/g, ' ')}
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{activeArticle.title}</h2>
              </div>
              <button onClick={() => setActiveArticle(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-300 text-sm leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800 leading-relaxed">
                {activeArticle.content_markdown}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Authoring Console Modal */}
      {showAuthorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✍️ Author & Publish Campus IP Guide</span>
              </h3>
              <button onClick={() => setShowAuthorModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Article Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Understanding Patent Ownership for Student Startups"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                  >
                    <option value="IP_BASICS">IP Basics</option>
                    <option value="PATENT_WORKFLOW">Patent Workflow</option>
                    <option value="PRIOR_ART_SEARCH">Prior-Art Search</option>
                    <option value="DISCLOSURE_GUIDE">Disclosure Guide</option>
                    <option value="COMMON_MISTAKES">Common Mistakes</option>
                    <option value="FAQ">FAQ Entry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Est. Read Time (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newReadTime}
                    onChange={(e) => setNewReadTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Short Executive Summary</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief 1-sentence summary of the guide..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Article Content (Markdown) *</label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Guide Title&#10;&#10;Write Markdown formatted educational content..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500 font-mono text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthorModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-lg transition"
                >
                  {publishing ? 'Publishing...' : 'Publish Article 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpAwarenessPortal;
