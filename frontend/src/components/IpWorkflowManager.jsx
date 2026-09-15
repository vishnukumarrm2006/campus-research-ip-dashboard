import React, { useState, useEffect } from 'react';
import AiScreeningReportView from './AiScreeningReportView';
import DocumentManager from './DocumentManager';
import InventionDisclosureEditor from './InventionDisclosureEditor';

const FILING_STAGES = [
  { key: 'NOT_EVALUATED', label: 'Not Evaluated', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { key: 'AI_SCREENED', label: 'AI Screened', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'RECOMMENDED_FOR_IP_REVIEW', label: 'Recommended for IP Review', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'UNDER_IP_EVALUATION', label: 'Under IP Evaluation', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { key: 'REJECTED_FOR_FILING', label: 'Filing Rejected', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { key: 'PATENT_DRAFTING_IN_PROGRESS', label: 'Drafting In Progress', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { key: 'PATENT_FILED', label: 'Patent Filed', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { key: 'PATENT_PUBLISHED', label: 'Patent Published', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { key: 'EXAMINATION_REQUESTED', label: 'Exam Requested', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { key: 'PATENT_GRANTED', label: 'Patent Granted 🏆', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
];

const IpWorkflowManager = ({ token, user }) => {
  const [projects, setProjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Dossier Inspector
  const [activeDossierId, setActiveDossierId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('evaluation'); // 'overview', 'ai_report', 'documents', 'evaluation', 'history'

  // Evaluation Form State
  const [formStatus, setFormStatus] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDocketNo, setFormDocketNo] = useState('');
  const [formAppNo, setFormAppNo] = useState('');
  const [formFilingDate, setFormFilingDate] = useState('');
  const [formGrantNo, setFormGrantNo] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchDomains();
    fetchIpQueue();
  }, [selectedDomain, selectedStatus]);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDomains(data.domains || []);
    } catch (e) {
      console.error('Failed to fetch domains', e);
    }
  };

  const fetchIpQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      let queryParams = new URLSearchParams();
      if (selectedDomain) queryParams.append('domain_id', selectedDomain);
      if (selectedStatus) queryParams.append('status', selectedStatus);

      const res = await fetch(`/api/ip/projects?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to load IP queue.');
      }
    } catch (err) {
      setError('Connection error while fetching IP project queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = async (projectId) => {
    setActiveDossierId(projectId);
    setDossierLoading(true);
    setDossier(null);
    setActiveTab('evaluation');

    try {
      const res = await fetch(`/api/ip/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.dossier) {
        setDossier(data.dossier);
        const p = data.dossier.project;
        const rev = data.dossier.ip_review;

        setFormStatus(p.status || 'RECOMMENDED_FOR_IP_REVIEW');
        setFormNotes(rev ? rev.patentability_notes || '' : '');
        setFormDocketNo(rev ? rev.docket_number || '' : `IP-${new Date().getFullYear()}-PAT-${String(projectId).padStart(4, '0')}`);
        setFormAppNo(rev ? rev.application_number || '' : '');
        setFormFilingDate(rev ? rev.filing_date || '' : '');
        setFormGrantNo(rev ? rev.grant_number || '' : '');
      } else {
        setError(data.error || 'Failed to fetch IP dossier.');
      }
    } catch (err) {
      setError('Failed to connect to server for IP dossier.');
    } finally {
      setDossierLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!formNotes.trim()) {
      alert('Please enter evaluation notes/comments explaining this status update.');
      return;
    }

    setSubmittingStatus(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/ip/projects/${activeDossierId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: formStatus,
          evaluation_notes: formNotes,
          docket_number: formDocketNo,
          application_number: formAppNo,
          filing_date: formFilingDate,
          grant_number: formGrantNo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message);
        fetchIpQueue();
        handleOpenDossier(activeDossierId);
      } else {
        setError(data.error || 'Failed to update IP filing status.');
      }
    } catch (err) {
      setError('Connection error while updating status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStageBadge = (stageKey) => {
    const stage = FILING_STAGES.find(s => s.key === stageKey);
    if (!stage) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700 text-slate-300 border border-slate-600">
          {stageKey ? stageKey.replace(/_/g, ' ') : 'UNKNOWN'}
        </span>
      );
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${stage.color}`}>
        {stage.label}
      </span>
    );
  };

  const filteredProjectsList = projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.student_roll_number && p.student_roll_number.toLowerCase().includes(q))
    );
  });

  // Calculate Statistics
  const totalCount = projects.length;
  const recommendedCount = projects.filter(p => p.status === 'RECOMMENDED_FOR_IP_REVIEW' || p.status === 'AI_SCREENED').length;
  const underEvaluationCount = projects.filter(p => p.status === 'UNDER_IP_EVALUATION' || p.status === 'PATENT_DRAFTING_IN_PROGRESS').length;
  const filedCount = projects.filter(p => p.status === 'PATENT_FILED' || p.status === 'PATENT_PUBLISHED' || p.status === 'EXAMINATION_REQUESTED').length;
  const grantedCount = projects.filter(p => p.status === 'PATENT_GRANTED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">
              <span>🏛️ Institutional IP Management Office</span>
              <span>•</span>
              <span>10-Stage Patent Lifecycle</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">IP Coordinator Workflow & Filing Desk</h1>
            <p className="text-slate-400 text-sm mt-1">
              Evaluate campus invention disclosures, review AI novelty screening reports, and manage official patent filing state transitions.
            </p>
          </div>
          <button
            onClick={fetchIpQueue}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            <span>🔄 Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Dossiers</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">In campus pipeline</p>
        </div>
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-4">
          <p className="text-xs text-amber-400 font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{recommendedCount}</p>
          <p className="text-[11px] text-amber-500/70 mt-1">Awaiting evaluation</p>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/30 rounded-xl p-4">
          <p className="text-xs text-purple-400 font-medium">Under Evaluation</p>
          <p className="text-2xl font-bold text-purple-300 mt-1">{underEvaluationCount}</p>
          <p className="text-[11px] text-purple-500/70 mt-1">Active analysis/drafting</p>
        </div>
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4">
          <p className="text-xs text-indigo-400 font-medium">Patents Filed</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1">{filedCount}</p>
          <p className="text-[11px] text-indigo-500/70 mt-1">Filed with Patent Office</p>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-xs text-emerald-400 font-medium">Patents Granted</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{grantedCount}</p>
          <p className="text-[11px] text-emerald-500/70 mt-1">Granted IP assets 🏆</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search project, student, roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">All Domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">All Filing Stages</option>
            {FILING_STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {(selectedDomain || selectedStatus || searchQuery) && (
            <button
              onClick={() => { setSelectedDomain(''); setSelectedStatus(''); setSearchQuery(''); }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Queue Data Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span>📋 IP Evaluation Queue</span>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full">{filteredProjectsList.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading IP project queue...</div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border-l-4 border-rose-500 text-rose-300 text-sm m-4 rounded-r-lg">
            {error}
          </div>
        ) : filteredProjectsList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No projects matching selected queue filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Project & Lead Student</th>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">AI Novelty Score</th>
                  <th className="py-3.5 px-4">Disclosures</th>
                  <th className="py-3.5 px-4">Current Filing Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProjectsList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-semibold text-white truncate" title={p.title}>{p.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {p.student_name} ({p.student_roll_number}) • Mentor: {p.faculty_name}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {p.domain_name}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {p.ai_screening ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400">{p.ai_screening.similarity_score}% Sim</span>
                            <span className="text-[11px] text-slate-400">({p.ai_screening.recommendation})</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not Screened</span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {p.document_counts.invention_disclosure > 0 ? (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          📄 {p.document_counts.invention_disclosure} Form(s)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {p.document_counts.total} doc(s)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStageBadge(p.status)}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDossier(p.id)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg shadow transition"
                      >
                        Inspect Dossier & Evaluate 🔍
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IP Dossier Modal / Inspector Overlay */}
      {activeDossierId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Project IP Dossier #{activeDossierId}</span>
                  <span>•</span>
                  {dossier?.project?.status && getStageBadge(dossier.project.status)}
                </div>
                <h2 className="text-xl font-bold text-white">{dossier?.project?.title || 'Loading Dossier...'}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Domain: {dossier?.project?.domain_name} | Lead: {dossier?.project?.student_name} ({dossier?.project?.student_roll_number}) | Mentor: {dossier?.project?.faculty_name}
                </p>
              </div>
              <button
                onClick={() => setActiveDossierId(null)}
                className="text-slate-400 hover:text-white p-2 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* 10-Stage Pipeline Progress Bar Visualizer */}
            {dossier && (
              <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 overflow-x-auto">
                <div className="flex items-center min-w-max gap-1">
                  {FILING_STAGES.map((s, idx) => {
                    const currentIndex = FILING_STAGES.findIndex(st => st.key === dossier.project.status);
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;
                    return (
                      <React.Fragment key={s.key}>
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            isCurrent
                              ? 'bg-purple-600 text-white shadow-lg border border-purple-400'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800/60 text-slate-500 border border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] opacity-75">{idx + 1}.</span>
                          <span>{s.label}</span>
                        </div>
                        {idx < FILING_STAGES.length - 1 && (
                          <div className={`w-3 h-0.5 ${idx < currentIndex ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Body Tabs */}
            <div className="border-b border-slate-800 bg-slate-900/80 flex px-6 space-x-4">
              <button
                onClick={() => setActiveTab('evaluation')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'evaluation'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🏛️ IP Evaluation & Status Update
              </button>
              <button
                onClick={() => setActiveTab('ai_report')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'ai_report'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🤖 AI Screening Report
              </button>
              <button
                onClick={() => setActiveTab('idf_editor')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'idf_editor'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Invention Disclosure Form (IDF)
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'documents'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📄 Disclosure Documents ({dossier?.documents?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 Project Specification & Roster
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === 'history'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📜 Institutional Review Audit Log
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {dossierLoading ? (
                <div className="p-12 text-center text-slate-400">Loading complete IP dossier...</div>
              ) : !dossier ? (
                <div className="p-6 text-rose-400">Failed to load dossier information.</div>
              ) : (
                <>
                  {/* TAB 1: IP Evaluation Form */}
                  {activeTab === 'evaluation' && (
                    <div className="space-y-6">
                      {successMessage && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex justify-between items-center">
                          <span>✅ {successMessage}</span>
                          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:underline">Dismiss</button>
                        </div>
                      )}

                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-base font-bold text-white mb-1">Update Patent Lifecycle Filing Status</h3>
                        <p className="text-xs text-slate-400 mb-4">
                          Select target status, enter official docket/application details, and record binding institutional evaluation notes.
                        </p>

                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                Target Filing Lifecycle Stage <span className="text-rose-400">*</span>
                              </label>
                              <select
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                                required
                              >
                                {FILING_STAGES.map(s => (
                                  <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                Institutional Docket Reference No.
                              </label>
                              <input
                                type="text"
                                value={formDocketNo}
                                onChange={(e) => setFormDocketNo(e.target.value)}
                                placeholder="e.g. IP-2026-PAT-0001"
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                Patent Application No. (IPO/USPTO)
                              </label>
                              <input
                                type="text"
                                value={formAppNo}
                                onChange={(e) => setFormAppNo(e.target.value)}
                                placeholder="e.g. 202641012345 A"
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                Official Filing Date
                              </label>
                              <input
                                type="date"
                                value={formFilingDate}
                                onChange={(e) => setFormFilingDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                                Patent Grant Number (If Granted)
                              </label>
                              <input
                                type="text"
                                value={formGrantNo}
                                onChange={(e) => setFormGrantNo(e.target.value)}
                                placeholder="e.g. IN-PAT-394821"
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                              Coordinator Evaluation & Patentability Notes <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                              rows={4}
                              value={formNotes}
                              onChange={(e) => setFormNotes(e.target.value)}
                              placeholder="Record institutional evaluation summary, patent attorney feedback, claims scope review, or non-obviousness rationale..."
                              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-purple-500"
                              required
                            />
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setActiveDossierId(null)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
                            >
                              Close
                            </button>
                            <button
                              type="submit"
                              disabled={submittingStatus}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg transition flex items-center gap-2"
                            >
                              {submittingStatus ? 'Updating Status...' : 'Submit IP Lifecycle Transition 🚀'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AI Screening Report */}
                  {activeTab === 'ai_report' && (
                    <div>
                      {dossier.ai_screening_report ? (
                        <AiScreeningReportView report={dossier.ai_screening_report} />
                      ) : (
                        <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-400">
                          <p className="text-base font-semibold text-slate-300">No AI Screening Report generated yet for this project.</p>
                          <p className="text-xs text-slate-500 mt-1">The student or faculty mentor can trigger the AI Screening Engine from their workspace.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2.5: Invention Disclosure Form */}
                  {activeTab === 'idf_editor' && (
                    <div>
                      <InventionDisclosureEditor
                        projectId={activeDossierId}
                        token={token}
                        userRole={user.role_name}
                      />
                    </div>
                  )}

                  {/* TAB 3: Documents */}
                  {activeTab === 'documents' && (
                    <div>
                      <DocumentManager
                        projectId={activeDossierId}
                        token={token}
                        userRole={user.role_name}
                      />
                    </div>
                  )}

                  {/* TAB 4: Overview & Roster */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase">Abstract</h4>
                          <p className="text-sm text-slate-200 mt-1 leading-relaxed">{dossier.project.abstract || 'No abstract provided.'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <h4 className="text-xs font-semibold text-purple-400 uppercase">Problem Statement</h4>
                            <p className="text-sm text-slate-300 mt-1">{dossier.project.problem_statement || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-purple-400 uppercase">Claimed Innovation</h4>
                            <p className="text-sm text-slate-300 mt-1">{dossier.project.innovation_description || 'N/A'}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase">Technologies & Hardware</h4>
                          <p className="text-sm text-slate-300 mt-1">{dossier.project.technologies || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Team Roster */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6">
                        <h4 className="text-sm font-bold text-white mb-3">Project Roster & Inventors</h4>
                        <div className="divide-y divide-slate-800">
                          {dossier.team_members.map((m) => (
                            <div key={m.id} className="py-2.5 flex justify-between items-center text-sm">
                              <div>
                                <span className="font-semibold text-white">{m.full_name}</span>
                                <span className="text-xs text-slate-400 ml-2">({m.roll_number} • {m.department})</span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                m.role_in_project === 'LEAD' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {m.role_in_project}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Audit History Timeline */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white">Institutional Review Audit Log</h3>
                      {dossier.filing_history.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">No review logs recorded yet.</div>
                      ) : (
                        <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
                          {dossier.filing_history.map((h) => (
                            <div key={h.id} className="relative pl-6">
                              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-slate-900"></div>
                              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs text-slate-400 font-semibold">{h.changed_by_name} ({h.changed_by_role})</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-slate-500">{h.previous_status}</span>
                                      <span className="text-xs text-slate-400">➔</span>
                                      <span className="text-xs font-bold text-purple-300">{h.new_status}</span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] text-slate-500">{new Date(h.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-300 mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                                  {h.comments}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default IpWorkflowManager;
