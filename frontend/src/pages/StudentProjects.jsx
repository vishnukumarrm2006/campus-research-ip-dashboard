import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Edit2,
  Users,
  Send,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  ChevronRight,
  Sparkles,
  UserPlus,
  Trash2,
  Info,
  Clock,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function StudentProjects() {
  const { user } = useAuth();

  // Data states
  const [projects, setProjects] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(null); // Project object

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    abstract: '',
    problem_statement: '',
    objectives: '',
    methodology: '',
    technologies: '',
    features: '',
    innovation_description: '',
    domain_id: '',
  });

  // Team Member Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, domRes] = await Promise.all([
        apiClient.get('/projects', {
          params: {
            domain_id: selectedDomain || undefined,
            status: selectedStatus || undefined,
            search: searchQuery || undefined,
          }
        }),
        apiClient.get('/domains')
      ]);

      setProjects(projRes.data.projects || []);
      setDomains(domRes.data.domains || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDomain, selectedStatus, searchQuery]);

  const handleOpenCreateModal = (projectToEdit = null) => {
    if (projectToEdit) {
      setFormData({
        id: projectToEdit.id,
        title: projectToEdit.title,
        abstract: projectToEdit.abstract,
        problem_statement: projectToEdit.problem_statement,
        objectives: projectToEdit.objectives,
        methodology: projectToEdit.methodology,
        technologies: projectToEdit.technologies,
        features: projectToEdit.features || '',
        innovation_description: projectToEdit.innovation_description || '',
        domain_id: projectToEdit.domain_id,
      });
    } else {
      setFormData({
        id: null,
        title: '',
        abstract: '',
        problem_statement: '',
        objectives: '',
        methodology: '',
        technologies: '',
        features: '',
        innovation_description: '',
        domain_id: domains.length > 0 ? domains[0].id : '',
      });
    }
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.abstract || !formData.domain_id) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      if (formData.id) {
        // Update Project
        const res = await apiClient.put(`/projects/${formData.id}`, formData);
        setSuccessMsg(res.data.message);
      } else {
        // Create Project
        const res = await apiClient.post('/projects', formData);
        setSuccessMsg(res.data.message);
      }
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project.');
    }
  };

  const handleSubmitForReview = async (projectId) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/submit`);
      setSuccessMsg(res.data.message);
      fetchData();
      if (selectedProjectDetail && selectedProjectDetail.id === projectId) {
        handleViewProjectDetail(projectId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit project.');
    }
  };

  const handleViewProjectDetail = async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}`);
      setSelectedProjectDetail(res.data.project);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project details.');
    }
  };

  const handleSearchStudents = async (query) => {
    setStudentSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchingStudents(true);
    try {
      const res = await apiClient.get('/projects/students/search', { params: { q: query } });
      setSearchResults(res.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleAddTeamMember = async (projectId, studentId) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/members`, { student_id: studentId });
      setSuccessMsg(res.data.message);
      fetchData();
      if (selectedProjectDetail && selectedProjectDetail.id === projectId) {
        handleViewProjectDetail(projectId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add team member.');
    }
  };

  const handleRemoveTeamMember = async (projectId, studentId) => {
    try {
      const res = await apiClient.delete(`/projects/${projectId}/members/${studentId}`);
      setSuccessMsg(res.data.message);
      fetchData();
      if (selectedProjectDetail && selectedProjectDetail.id === projectId) {
        handleViewProjectDetail(projectId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove team member.');
    }
  };

  const statusBadges = {
    DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
    SUBMITTED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    UNDER_FACULTY_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    REVISION_REQUESTED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    FACULTY_APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    RECOMMENDED_FOR_IP_REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    APPROVED_FOR_IP_PROCESSING: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/20">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Student Research Project Lifecycle</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit new project proposals, tag research domains, manage team members, and track faculty review progress.
          </p>
        </div>

        {user.role_name === 'STUDENT' && (
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Research Project</span>
          </button>
        )}
      </div>

      {/* Alert Banners */}
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

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, abstract or technology..."
            className="w-full md:w-72 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium focus:outline-none"
          >
            <option value="">All Research Domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium focus:outline-none"
          >
            <option value="">All Status States</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_FACULTY_REVIEW">UNDER_FACULTY_REVIEW</option>
            <option value="FACULTY_APPROVED">FACULTY_APPROVED</option>
            <option value="RECOMMENDED_FOR_IP_REVIEW">RECOMMENDED_FOR_IP_REVIEW</option>
            <option value="APPROVED_FOR_IP_PROCESSING">APPROVED_FOR_IP_PROCESSING</option>
          </select>
        </div>
      </div>

      {/* Projects Directory List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-slate-800">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Research Projects Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No project submissions match your selected filters. Create a new research project to begin.
            </p>
          </div>
        ) : (
          projects.map((proj) => {
            const isCreator = proj.created_by_student_id === user.id;
            return (
              <div key={proj.id} className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4 hover:border-slate-700 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                        {proj.domain_name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusBadges[proj.status] || 'bg-slate-800 text-slate-300'}`}>
                        {proj.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white hover:text-indigo-200 transition cursor-pointer" onClick={() => handleViewProjectDetail(proj.id)}>
                      {proj.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleViewProjectDetail(proj.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isCreator && ['DRAFT', 'REVISION_REQUESTED'].includes(proj.status) && (
                      <>
                        <button
                          onClick={() => handleOpenCreateModal(proj)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 hover:border-amber-500/30 text-xs font-semibold transition flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleSubmitForReview(proj.id)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {proj.abstract}
                </p>

                {/* Team & Faculty Details Bar */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-400 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>
                        Lead: <strong className="text-slate-200">{proj.creator?.full_name}</strong> ({proj.team_members?.length || 1} Members)
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>
                        Faculty: {proj.assigned_faculty ? (
                          <strong className="text-emerald-300">{proj.assigned_faculty.full_name}</strong>
                        ) : (
                          <span className="text-amber-400 italic">Pending Assignment</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-500">Tech: {proj.technologies}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 space-y-6 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-950/90 py-2">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>{formData.id ? 'Edit Research Project Proposal' : 'New Research Project Submission'}</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Smart Autonomous Soil Sensor & Edge Analytics"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Research Domain *</label>
                  <select
                    value={formData.domain_id}
                    onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Core Technologies Used *</label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="e.g. ESP32, LoRaWAN, TensorFlow Lite Micro, Node.js"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Abstract Summary *</label>
                <textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={3}
                  placeholder="Comprehensive summary of project objectives, methodology, and outcome..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Problem Statement *</label>
                <textarea
                  value={formData.problem_statement}
                  onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                  rows={2}
                  placeholder="What specific engineering or societal problem does this project address?"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Project Objectives *</label>
                  <textarea
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    rows={3}
                    placeholder="1. Build optical sensor probe. 2. Implement LoRa mesh node."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Methodology *</label>
                  <textarea
                    value={formData.methodology}
                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                    rows={3}
                    placeholder="Technical design process, data pipelines, hardware/software workflow..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Key Features</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={2}
                    placeholder="Real-time telemetry, Solar powered fallback..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Novelty / Innovation Description</label>
                  <textarea
                    value={formData.innovation_description}
                    onChange={(e) => setFormData({ ...formData, innovation_description: e.target.value })}
                    rows={2}
                    placeholder="Describe what makes this technical solution unique or inventive..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:opacity-95"
                >
                  {formData.id ? 'Save Project Edits' : 'Create Draft Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAILS MODAL */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel max-w-3xl w-full rounded-2xl p-6 space-y-6 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                  {selectedProjectDetail.domain?.name}
                </span>
                <h3 className="text-xl font-bold text-white">{selectedProjectDetail.title}</h3>
              </div>
              <button onClick={() => setSelectedProjectDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Tabs */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Assigned Faculty Mentor:</span>
                  <span className="font-bold text-emerald-300 text-sm">
                    {selectedProjectDetail.assigned_faculty?.full_name || 'Pending Faculty Assignment'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lifecycle Status:</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${statusBadges[selectedProjectDetail.status]}`}>
                    {selectedProjectDetail.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Abstract</h4>
                <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  {selectedProjectDetail.abstract}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Problem Statement</h4>
                  <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    {selectedProjectDetail.problem_statement}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Innovation Description</h4>
                  <p className="text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    {selectedProjectDetail.innovation_description || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Project Team Roster</h4>
                  {selectedProjectDetail.created_by_student_id === user.id && (
                    <button
                      onClick={() => {
                        setShowTeamModal(selectedProjectDetail);
                        handleSearchStudents('');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Manage Team Members</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProjectDetail.team_members?.map((m) => (
                    <div key={m.student_id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{m.full_name}</span>
                        <span className="text-[10px] text-slate-400">{m.roll_number} • {m.department}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.role_in_project === 'LEAD' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.role_in_project}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MANAGER MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 space-y-6 border border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Manage Team Members</h3>
              <button onClick={() => setShowTeamModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold">Search Students by Name or Roll Number</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => handleSearchStudents(e.target.value)}
                    placeholder="e.g. 2023AI015 or Diya"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-40 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Search Matches:</span>
                  {searchResults.map((std) => (
                    <div key={std.id} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-bold text-white block">{std.full_name}</span>
                        <span className="text-[10px] text-slate-400">{std.roll_number} • {std.department}</span>
                      </div>
                      <button
                        onClick={() => handleAddTeamMember(showTeamModal.id, std.id)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold"
                      >
                        Add to Team
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
