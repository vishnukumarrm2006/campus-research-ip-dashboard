import React, { useState, useEffect } from 'react';

const PLATFORMS = [
  { key: 'ALL', label: 'All Databases' },
  { key: 'Google Patents', label: 'Google Patents (USPTO/EPO)' },
  { key: 'IEEE Xplore', label: 'IEEE Xplore Journals' },
  { key: 'arXiv Preprints', label: 'arXiv Preprints' },
  { key: 'PubMed', label: 'PubMed / BioMed' },
  { key: 'IPO', label: 'Indian Patent Office (IPO)' },
];

const PriorArtSearchTool = ({ token, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [minSimilarity, setMinSimilarity] = useState(5.0);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Projects list for query auto-fill & bookmarking target
  const [projects, setProjects] = useState([]);
  const [selectedProjectForBookmark, setSelectedProjectForBookmark] = useState('');
  const [savedCitations, setSavedCitations] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [bookmarkingId, setBookmarkingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchProjects();
    handleExecuteSearch();
  }, []);

  useEffect(() => {
    if (selectedProjectForBookmark) {
      fetchSavedCitations(selectedProjectForBookmark);
    }
  }, [selectedProjectForBookmark]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setSelectedProjectForBookmark(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user projects for prior-art search', err);
    }
  };

  const fetchSavedCitations = async (projectId) => {
    setLoadingSaved(true);
    try {
      const res = await fetch(`/api/prior-art/saved/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSavedCitations(data.citations || []);
      }
    } catch (err) {
      console.error('Failed to fetch saved citations', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleExecuteSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch('/api/prior-art/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          source_platform: selectedPlatform,
          domain_name: selectedDomain,
          min_similarity: minSimilarity,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        setError(data.error || 'Failed to execute prior-art database search.');
      }
    } catch (err) {
      setError('Connection error while searching prior-art databases.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportProjectQuery = (projectId) => {
    const proj = projects.find(p => p.id === parseInt(projectId, 10));
    if (proj) {
      const keywords = `${proj.title} ${proj.innovation_description || ''} ${proj.technologies || ''}`;
      setSearchQuery(keywords);
      setSelectedProjectForBookmark(proj.id);
    }
  };

  const handleBookmarkResult = async (item) => {
    if (!selectedProjectForBookmark) {
      alert('Please select a target project disclosure to attach this citation.');
      return;
    }

    setBookmarkingId(item.id);
    setSuccessMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/prior-art/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: selectedProjectForBookmark,
          citation_title: item.citation_title,
          source_platform: item.source_platform,
          document_id: item.document_id,
          authors_assignees: item.authors_assignees,
          publication_year: item.publication_year,
          similarity_score: item.similarity_score,
          abstract_snippet: item.abstract_snippet,
          url: item.url,
          relevance_notes: `Matched ${item.similarity_score}% similarity in ${item.domain_category || 'domain'} search.`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Bookmarked "${item.document_id}" for Project #${selectedProjectForBookmark}!`);
        fetchSavedCitations(selectedProjectForBookmark);
      } else {
        setError(data.error || 'Failed to bookmark citation.');
      }
    } catch (err) {
      setError('Connection error while bookmarking citation.');
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleDeleteSavedCitation = async (citationId) => {
    try {
      const res = await fetch(`/api/prior-art/saved/${citationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedCitations(selectedProjectForBookmark);
      }
    } catch (err) {
      console.error('Failed to delete citation', err);
    }
  };

  const getPlatformBadge = (platform) => {
    if (platform.includes('Patent')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (platform.includes('IEEE')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (platform.includes('arXiv')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (platform.includes('PubMed')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1">
              <span>🌐 Global Prior-Art Index</span>
              <span>•</span>
              <span>Google Patents • IEEE • arXiv • IPO</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Prior-Art Literature & Patent Database Lookup Engine</h1>
            <p className="text-slate-400 text-sm mt-1">
              Search global patent publications and scientific literature prior to submitting invention disclosures or filing formal patents.
            </p>
          </div>
        </div>
      </div>

      {/* Main Search Controls Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Import from Project Dropdown */}
        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
              💡 Quick Auto-Fill from Project:
            </span>
            <select
              value={selectedProjectForBookmark}
              onChange={(e) => {
                setSelectedProjectForBookmark(e.target.value);
                handleImportProjectQuery(e.target.value);
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 w-full"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  Project #{p.id}: {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input Bar */}
        <form onSubmit={handleExecuteSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter research keywords, technology terms, patent numbers, or abstract claims..."
                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Searching Index...</span>
              ) : (
                <>
                  <span>Search Databases</span>
                  <span>🔍</span>
                </>
              )}
            </button>
          </div>

          {/* Platform Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Database Source:</span>
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlatform(p.key)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                  selectedPlatform === p.key
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Success/Error Alerts */}
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

      {/* Content Layout: 2 Columns (Results List + Bookmarked Citations) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Search Results List (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>📚 Prior-Art Database Search Results</span>
              <span className="px-2.5 py-0.5 text-xs bg-slate-800 text-indigo-300 rounded-full">{results.length} Matches</span>
            </h2>
          </div>

          {loading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Executing similarity search against indexed patent literature...
            </div>
          ) : results.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              No matching prior-art literature found matching your criteria. Try adjusting query keywords.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded border uppercase ${getPlatformBadge(item.source_platform)}`}>
                          {item.source_platform}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-semibold">{item.document_id}</span>
                        <span>•</span>
                        <span className="text-xs text-slate-400">{item.publication_year}</span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-bold text-white hover:text-indigo-300 transition flex items-center gap-1.5"
                      >
                        <span>{item.citation_title}</span>
                        <span className="text-xs text-indigo-400">↗</span>
                      </a>
                      <p className="text-xs text-slate-400 mt-1">Authors/Assignees: <span className="text-slate-300">{item.authors_assignees}</span></p>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-center">
                        <span className="text-xs block text-slate-400">Match Score</span>
                        <span className="text-base font-bold text-indigo-300">{item.similarity_score}%</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    "{item.abstract_snippet}"
                  </p>

                  <div className="flex justify-between items-center pt-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      View Source Document on {item.source_platform} 🔗
                    </a>

                    <button
                      onClick={() => handleBookmarkResult(item)}
                      disabled={bookmarkingId === item.id}
                      className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                    >
                      <span>{bookmarkingId === item.id ? 'Bookmarking...' : '🔖 Bookmark for Project Disclosure'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Saved Citations Panel (Span 1) */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📌 Bookmarked Citations</span>
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">{savedCitations.length}</span>
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Attached to <span className="text-purple-300 font-semibold">Project #{selectedProjectForBookmark}</span> disclosure record:
            </p>

            {loadingSaved ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading saved citations...</div>
            ) : savedCitations.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                No citations bookmarked for Project #{selectedProjectForBookmark} yet. Click "Bookmark" on any result to attach.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {savedCitations.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-200 line-clamp-2">{c.citation_title}</span>
                      <button
                        onClick={() => handleDeleteSavedCitation(c.id)}
                        className="text-slate-500 hover:text-rose-400 ml-2"
                        title="Remove citation"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-purple-400 font-semibold">{c.source_platform}</span>
                      <span>•</span>
                      <span className="font-mono">{c.document_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{c.relevance_notes}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PriorArtSearchTool;
