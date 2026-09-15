import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Zap,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';

export default function AiScreeningReportView({ projectId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchReport = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/projects/${projectId}/ai-screening`);
      setReport(res.data.report || null);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to load AI screening report.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [projectId]);

  const handleTriggerScreening = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await apiClient.post(`/projects/${projectId}/ai-screening`);
      setReport(res.data.report);
      setSuccessMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'AI Screening execution failed.');
    } finally {
      setGenerating(false);
    }
  };

  const recBadges = {
    HIGH_NOVELTY_POTENTIAL: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    MODERATE_NOVELTY: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    HIGH_SIMILARITY_RISK: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Explicit Non-Legal Disclaimer Alert (REQUIRED BY PROMPT) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-amber-400">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Non-Legal Decision Support Disclaimer</span>
        </div>
        <p className="leading-relaxed text-[11px] text-amber-200/90 font-medium">
          {report?.disclaimer ||
            'IMPORTANT DISCLAIMER: This AI screening report is a preliminary decision-support analysis only. ' +
            'It does not constitute a formal legal opinion, guarantee absolute uniqueness, or declare official patentability. ' +
            'Final IP evaluations are determined solely by the Institutional IP Coordinator.'}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3 glass-panel rounded-2xl border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
          <span className="text-xs">Loading AI Originality Screening Report...</span>
        </div>
      ) : !report ? (
        <div className="p-12 text-center text-slate-400 space-y-4 glass-panel rounded-2xl border border-slate-800">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No AI Screening Report Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run the AI Originality Screening engine to analyze title, abstract, problem statement, objectives, methodology, technologies, and novel features against prior-art indices.
            </p>
          </div>
          <button
            onClick={handleTriggerScreening}
            disabled={generating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/30 inline-flex items-center space-x-2 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Running Semantic AI Screening...' : 'Execute AI Originality Screening'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Report Generated:</span>
              <span className="text-slate-400 font-mono">{new Date(report.created_at || Date.now()).toLocaleString()}</span>
            </div>

            <button
              onClick={handleTriggerScreening}
              disabled={generating}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 font-semibold transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Re-analyzing...' : 'Re-Run AI Screening'}</span>
            </button>
          </div>

          {/* Metric Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 font-semibold block">Similarity Score %</span>
              <span className={`text-3xl font-extrabold font-mono ${
                report.similarity_score < 25 ? 'text-emerald-400' : report.similarity_score < 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {report.similarity_score}%
              </span>
              <span className="text-[10px] text-slate-500 block">Lower similarity = Higher novelty</span>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 font-semibold block">Confidence Score %</span>
              <span className="text-3xl font-extrabold font-mono text-purple-400">
                {report.confidence_score}%
              </span>
              <span className="text-[10px] text-slate-500 block">Semantic vector confidence</span>
            </div>

            <div className="glass-card p-5 rounded-xl border border-slate-800 text-center space-y-1 flex flex-col justify-center items-center">
              <span className="text-xs text-slate-400 font-semibold block">AI Recommendation</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase mt-1 ${
                recBadges[report.recommendation] || 'bg-slate-800 text-slate-300'
              }`}>
                {report.recommendation?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Analysis Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Potentially Novel Features */}
            <div className="glass-panel p-5 rounded-xl border border-emerald-500/20 space-y-3 bg-emerald-950/20">
              <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Potentially Novel Features</span>
              </h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                {report.potentially_novel_features_summary}
              </p>
            </div>

            {/* Potentially Overlapping Features */}
            <div className="glass-panel p-5 rounded-xl border border-amber-500/20 space-y-3 bg-amber-950/20">
              <h4 className="font-bold text-amber-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Potentially Overlapping Features</span>
              </h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                {report.overlapping_features_summary}
              </p>
            </div>
          </div>

          {/* Similar Concepts Summary */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Similar Concepts Analysis</h4>
            <p className="text-slate-300 leading-relaxed">
              {report.similar_concepts_summary}
            </p>
          </div>

          {/* Matched Prior-Art Sources Table */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Matched Prior-Art Literature & Patent Disclosures</h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {report.matched_sources?.length || 0} Matches Found
              </span>
            </div>

            <div className="space-y-3">
              {report.matched_sources?.map((src, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <a
                      href={src.matched_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-300 hover:text-indigo-200 flex items-center space-x-1"
                    >
                      <span>{src.matched_source_title}</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold text-[10px]">
                      {src.similarity_percentage}% Overlap
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">
                    <strong className="text-slate-300">Overlapping Segment:</strong> {src.matched_segment_description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
