import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  FileCheck,
  Sparkles,
  Users,
  ChevronRight,
  Layers,
  X,
  ThumbsUp,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function FacultyReview() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Evaluation Modal State
  const [evaluationMilestone, setEvaluationMilestone] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  const fetchAssignedProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/projects');
      setProjects(res.data.projects || []);
      if (res.data.projects?.length > 0 && !selectedProject) {
        handleSelectProject(res.data.projects[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load assigned projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const handleSelectProject = async (projectId) => {
    try {
      const [projRes, msRes] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/milestones`)
      ]);
      setSelectedProject(projRes.data.project);
      setMilestones(msRes.data.milestones || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project details');
    }
  };

  const handleOpenEvaluationModal = (milestone) => {
    setEvaluationMilestone(milestone);
    setFeedbackText('');
  };

  const handleSubmitEvaluation = async (statusAction) => {
    if (!feedbackText.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    setSubmittingEval(true);
    try {
      const res = await apiClient.post(`/milestones/${evaluationMilestone.id}/feedback`, {
        feedback_text: feedbackText,
        status_action: statusAction,
      });

      setSuccessMsg(res.data.message);
      setEvaluationMilestone(null);
      setFeedbackText('');
      if (selectedProject) {
        handleSelectProject(selectedProject.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record evaluation feedback.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const handleRecommendForAi = async () => {
    if (!selectedProject) return;
    try {
      const res = await apiClient.post(`/projects/${selectedProject.id}/recommend-ai`);
      setSuccessMsg(res.data.message);
      handleSelectProject(selectedProject.id);
      fetchAssignedProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to recommend project for AI screening.');
    }
  };

  const statusBadges = {
    PENDING: 'bg-slate-800 text-slate-400 border-slate-700',
    SUBMITTED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    REVISION_REQUIRED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    REJECTED: 'bg-rose-950 text-rose-400 border-rose-800',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Award className="w-6 h-6 text-emerald-400" />
            <span>Faculty Mentorship & Milestone Evaluation Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review student project specifications, evaluate milestone progress, provide feedback, request revisions, and recommend for AI Originality Screening.
          </p>
        </div>

        {selectedProject && (
          <button
            onClick={handleRecommendForAi}
            disabled={selectedProject.status === 'RECOMMENDED_FOR_AI_SCREENING'}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-lg ${
              selectedProject.status === 'RECOMMENDED_FOR_AI_SCREENING'
                ? 'bg-purple-950 border border-purple-500/30 text-purple-300 opacity-80 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white shadow-purple-600/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {selectedProject.status === 'RECOMMENDED_FOR_AI_SCREENING'
                ? 'Recommended for AI Screening'
                : 'Recommend for AI Originality Screening'}
            </span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Assigned Projects List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Projects Queue ({projects.length})
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">Faculty View</span>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => {
              const isSelected = selectedProject && selectedProject.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                      {proj.domain_name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase text-amber-400">
                      {proj.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{proj.title}</h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="truncate">Lead: {proj.creator?.full_name}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Project Technical Specs & Milestone Review Suite */}
        {selectedProject ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Technical Proposal Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    {selectedProject.domain?.name}
                  </span>
                  <h3 className="text-xl font-bold text-white">{selectedProject.title}</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">ID #{selectedProject.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-emerald-400 mb-1">Abstract Summary:</h4>
                  <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800">
                    {selectedProject.abstract}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-bold text-emerald-400 mb-1">Problem Statement:</h4>
                    <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800">
                      {selectedProject.problem_statement}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-400 mb-1">Innovation Description:</h4>
                    <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800">
                      {selectedProject.innovation_description || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <span>Student Lead: <strong className="text-white">{selectedProject.creator?.full_name}</strong></span>
                  <span>Technologies: <strong className="text-indigo-300">{selectedProject.technologies}</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive Visual Milestone Timeline & Evaluation */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Project Milestone Timeline & Progress Submissions</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{milestones.length} Milestones</span>
              </div>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {milestones.map((ms, index) => {
                  const hasSubmissions = ms.submissions && ms.submissions.length > 0;
                  const latestSubmission = hasSubmissions ? ms.submissions[ms.submissions.length - 1] : null;

                  return (
                    <div key={ms.id} className="relative pl-10 space-y-3">
                      {/* Timeline Dot */}
                      <div className={`absolute left-2.5 top-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        ms.status === 'APPROVED' ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/50' :
                        ms.status === 'SUBMITTED' ? 'bg-amber-500 border-amber-400 animate-pulse' :
                        ms.status === 'REVISION_REQUIRED' ? 'bg-rose-500 border-rose-400' : 'bg-slate-900 border-slate-700'
                      }`}>
                      </div>

                      <div className="glass-card rounded-xl p-5 border border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                              Milestone Sequence #{ms.sequence_order}
                            </span>
                            <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${statusBadges[ms.status]}`}>
                              {ms.status.replace(/_/g, ' ')}
                            </span>

                            <button
                              onClick={() => handleOpenEvaluationModal(ms)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center space-x-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Evaluate</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-snug">{ms.description}</p>

                        {/* Latest Student Submission Box */}
                        {latestSubmission && (
                          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold">
                              <span>Student Submission Text ({latestSubmission.student_name}):</span>
                              <span>{new Date(latestSubmission.submitted_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-200 font-mono leading-relaxed">
                              "{latestSubmission.submission_text}"
                            </p>
                          </div>
                        )}

                        {/* Faculty Feedback History */}
                        {ms.feedbacks && ms.feedbacks.length > 0 && (
                          <div className="space-y-1.5 pt-1 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Faculty Evaluation History:</span>
                            {ms.feedbacks.map((fb, idx) => (
                              <div key={idx} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-start space-x-2">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-slate-200 block">
                                    {fb.faculty_name} ({fb.status_action}):
                                  </span>
                                  <span className="text-slate-400">{fb.feedback_text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 glass-panel p-12 rounded-2xl text-center text-slate-400 border border-slate-800">
            Select a project from your queue to evaluate milestones.
          </div>
        )}
      </div>

      {/* FACULTY EVALUATION MODAL */}
      {evaluationMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 space-y-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Evaluate Milestone #{evaluationMilestone.sequence_order}</span>
              </h3>
              <button onClick={() => setEvaluationMilestone(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block">Milestone Title:</span>
                <span className="font-bold text-white text-sm">{evaluationMilestone.title}</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Faculty Feedback & Review Comments *</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Provide structured feedback, review guidance, or detailed revision instructions..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={submittingEval}
                  onClick={() => handleSubmitEvaluation('APPROVE')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/30"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Approve Milestone</span>
                </button>

                <button
                  type="button"
                  disabled={submittingEval}
                  onClick={() => handleSubmitEvaluation('REQUEST_IMPROVEMENT')}
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center space-x-1 shadow-md shadow-amber-600/30"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Revisions</span>
                </button>

                <button
                  type="button"
                  disabled={submittingEval}
                  onClick={() => handleSubmitEvaluation('COMMENT')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold col-span-2 sm:col-span-1"
                >
                  <span>Add Comment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
