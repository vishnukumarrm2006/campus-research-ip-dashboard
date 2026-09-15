import React, { useState, useEffect } from 'react';

const InstitutionalAnalyticsDashboard = ({ token, user }) => {
  const [summary, setSummary] = useState(null);
  const [domains, setDomains] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resSummary, resDomains, resFunnel] = await Promise.all([
        fetch('/api/analytics/summary', { headers }),
        fetch('/api/analytics/domains', { headers }),
        fetch('/api/analytics/filing-conversion', { headers }),
      ]);

      const dataSummary = await resSummary.json();
      const dataDomains = await resDomains.json();
      const dataFunnel = await resFunnel.json();

      if (dataSummary.success) setSummary(dataSummary.metrics);
      if (dataDomains.success) setDomains(dataDomains.domains || []);
      if (dataFunnel.success) setFunnel(dataFunnel.funnel || []);
    } catch (err) {
      setError('Failed to connect to analytics server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = (format) => {
    if (format === 'csv') {
      window.open(`/api/analytics/export?format=csv&token=${token}`, '_blank');
    } else {
      window.open(`/api/analytics/export?format=json&token=${token}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading institutional research & IP telemetry metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
        {error}
      </div>
    );
  }

  const aiDist = summary?.ai_screening_novelty_distribution || {};
  const totalAi = (aiDist.HIGH_NOVELTY_POTENTIAL || 0) + (aiDist.MODERATE_NOVELTY || 0) + (aiDist.HIGH_SIMILARITY_RISK || 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1">
              <span>📊 Campus Executive Intelligence</span>
              <span>•</span>
              <span>Real-Time Telemetry</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Research & IP Analytics Console</h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor campus project volume, domain workload capacity, AI novelty ratios, and patent filing conversion pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleDownloadExport('csv')}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>📊 Export Executive CSV</span>
            </button>
            <button
              onClick={() => handleDownloadExport('json')}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>📄 Export JSON Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Research Projects</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{summary?.total_projects || 0}</span>
            <span className="text-xs text-slate-500">Active Proposals</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{summary?.total_student_inventors || 0} Student Lead Inventors</p>
        </div>

        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Faculty Mentor Utilization</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-300">{summary?.faculty_utilization_rate_pct || 0}%</span>
            <span className="text-xs text-emerald-500/70">Mentorship Rate</span>
          </div>
          <p className="text-[11px] text-emerald-500/70 mt-2">{summary?.total_faculty_mentors || 0} Faculty Advisors Assigned</p>
        </div>

        <div className="bg-slate-900/60 border border-purple-500/30 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">Patent Conversion Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-purple-300">{summary?.patent_filing_conversion_rate_pct || 0}%</span>
            <span className="text-xs text-purple-500/70">Filed or Granted</span>
          </div>
          <p className="text-[11px] text-purple-500/70 mt-2">{summary?.patents_filed_or_granted_count || 0} Patents in Official Pipeline</p>
        </div>

        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">Classified IP Documents</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-300">{summary?.total_documents_classified || 0}</span>
            <span className="text-xs text-indigo-500/70">Disclosures & IDF</span>
          </div>
          <p className="text-[11px] text-indigo-500/70 mt-2">Encrypted & RBAC Authorized</p>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Domain Distribution Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>🏛️ Research Domain Project Distribution</span>
              <span className="px-2 py-0.5 text-xs bg-slate-800 text-indigo-300 rounded-full">{domains.length} Domains</span>
            </h2>
          </div>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {domains.map((d) => {
              const maxCount = Math.max(...domains.map(dom => dom.project_count), 1);
              const barWidth = Math.max(8, (d.project_count / maxCount) * 100);

              return (
                <div key={d.id} className="space-y-1.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{d.name}</span>
                    <span className="text-indigo-400 font-semibold">{d.project_count} Project(s) • {d.faculty_count} Mentor(s)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Proposals: {d.stage_counts.SUBMITTED}</span>
                    <span>Review: {d.stage_counts.RECOMMENDED}</span>
                    <span>Filed/Granted: {d.stage_counts.FILED_GRANTED}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Screening Novelty & Funnel Metrics */}
        <div className="space-y-6">

          {/* AI Novelty Risk Distribution Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>🤖 AI Novelty Screening Risk Breakdown</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                <span className="text-[11px] text-emerald-400 font-semibold block">High Novelty</span>
                <span className="text-2xl font-extrabold text-emerald-300 mt-1 block">{aiDist.HIGH_NOVELTY_POTENTIAL || 0}</span>
                <span className="text-[10px] text-emerald-500/70 block mt-1">
                  {totalAi > 0 ? ((aiDist.HIGH_NOVELTY_POTENTIAL / totalAi) * 100).toFixed(0) : 0}% of screened
                </span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-center">
                <span className="text-[11px] text-amber-400 font-semibold block">Moderate</span>
                <span className="text-2xl font-extrabold text-amber-300 mt-1 block">{aiDist.MODERATE_NOVELTY || 0}</span>
                <span className="text-[10px] text-amber-500/70 block mt-1">
                  {totalAi > 0 ? ((aiDist.MODERATE_NOVELTY / totalAi) * 100).toFixed(0) : 0}% of screened
                </span>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-center">
                <span className="text-[11px] text-rose-400 font-semibold block">Similarity Risk</span>
                <span className="text-2xl font-extrabold text-rose-300 mt-1 block">{aiDist.HIGH_SIMILARITY_RISK || 0}</span>
                <span className="text-[10px] text-rose-500/70 block mt-1">
                  {totalAi > 0 ? ((aiDist.HIGH_SIMILARITY_RISK / totalAi) * 100).toFixed(0) : 0}% of screened
                </span>
              </div>
            </div>
          </div>

          {/* Patent Filing Conversion Funnel Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>📈 10-Stage Patent Conversion Funnel</span>
            </h2>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {funnel.map((item) => (
                <div key={item.stage} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-purple-300 flex items-center justify-center text-[10px] font-bold">
                      {item.step}
                    </span>
                    <span className="font-semibold text-slate-200">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{item.count}</span>
                    <span className="text-[11px] text-slate-500 w-12 text-right">({item.percentage_of_total}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InstitutionalAnalyticsDashboard;
