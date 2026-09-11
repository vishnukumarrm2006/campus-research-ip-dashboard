import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  Cpu,
  BookOpen,
  Check,
  X,
  UserPlus
} from 'lucide-react';

export default function DomainFacultyManagement() {
  const [activeTab, setActiveTab] = useState('domains'); // 'domains' | 'faculty' | 'assignments'

  // Data states
  const [domains, setDomains] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');
  const [editingDomain, setEditingDomain] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Faculty Domain Edit State
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [selectedDomainIds, setSelectedDomainIds] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [domRes, facRes] = await Promise.all([
        apiClient.get('/domains'),
        apiClient.get('/faculty')
      ]);
      setDomains(domRes.data.domains || []);
      setFaculty(facRes.data.faculty || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load domain and faculty data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDomain = async (e) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    try {
      const res = await apiClient.post('/domains', {
        name: newDomainName,
        description: newDomainDesc,
      });

      setSuccessMsg(res.data.message);
      setNewDomainName('');
      setNewDomainDesc('');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create domain');
    }
  };

  const handleUpdateDomain = async (e) => {
    e.preventDefault();
    if (!editingDomain) return;

    try {
      const res = await apiClient.put(`/domains/${editingDomain.id}`, {
        name: editingDomain.name,
        description: editingDomain.description,
        is_active: editingDomain.is_active,
      });

      setSuccessMsg(res.data.message);
      setEditingDomain(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update domain');
    }
  };

  const handleToggleDomainActive = async (domain) => {
    try {
      const res = await apiClient.put(`/domains/${domain.id}`, {
        is_active: !domain.is_active,
      });
      setSuccessMsg(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle domain state');
    }
  };

  const handleSaveFacultyDomains = async (facultyId) => {
    try {
      const res = await apiClient.post(`/faculty/${facultyId}/domains`, {
        domain_ids: selectedDomainIds,
      });
      setSuccessMsg(res.data.message);
      setEditingFacultyId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update faculty expertise mapping');
    }
  };

  const handleWorkloadChange = async (facultyId, maxProjects) => {
    try {
      const res = await apiClient.put(`/faculty/${facultyId}/workload`, {
        max_projects: maxProjects,
      });
      setSuccessMsg(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update workload threshold');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/20">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Domain & Faculty Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure research domains, map faculty domain expertise, and manage mentor workload thresholds.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('domains')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === 'domains' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Research Domains ({domains.length})
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === 'faculty' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Faculty Expertise ({faculty.length})
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
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

      {/* TAB 1: DOMAINS MANAGEMENT */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Institutional Research Domains</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Domain</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((dom) => (
              <div key={dom.id} className="glass-card rounded-xl p-5 space-y-4 border border-slate-800 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-400">ID #{dom.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dom.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {dom.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{dom.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{dom.description || 'No description provided.'}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Mapped Faculty:</span>
                    <span className="font-bold text-slate-200">{dom.faculty_count || 0} Faculty</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Active Projects:</span>
                    <span className="font-bold text-indigo-300">{dom.project_count || 0} Projects</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => setEditingDomain({ ...dom })}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition flex items-center justify-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleDomainActive(dom)}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center space-x-1 ${
                        dom.is_active
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      <span>{dom.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY EXPERTISE MAPPING */}
      {activeTab === 'faculty' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Faculty Members & Skill Mapping</h3>
            <span className="text-xs text-slate-400">Manage research domain expertise and project limits</span>
          </div>

          <div className="space-y-4">
            {faculty.map((fac) => {
              const isEditing = editingFacultyId === fac.id;
              return (
                <div key={fac.id} className="glass-card rounded-xl p-6 border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{fac.full_name}</h4>
                        <p className="text-xs text-slate-400">
                          {fac.designation} • {fac.department} ({fac.employee_id})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-right">
                        <span className="text-slate-400 block">Workload Limit:</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <select
                            value={fac.max_projects}
                            onChange={(e) => handleWorkloadChange(fac.id, parseInt(e.target.value, 10))}
                            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
                              <option key={num} value={num}>{num} Max Projects</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 block">Assigned Load:</span>
                        <span className={`font-extrabold font-mono text-sm ${
                          fac.available_capacity > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {fac.current_projects_count} / {fac.max_projects} ({fac.available_capacity} Capacity)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Domain Badges & Edit Interface */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Mapped Expertise Domains:</span>
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            setEditingFacultyId(fac.id);
                            setSelectedDomainIds(fac.domains.map(d => d.id));
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Expertise Domains</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSaveFacultyDomains(fac.id)}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Mapping</span>
                          </button>
                          <button
                            onClick={() => setEditingFacultyId(null)}
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {fac.domains.length > 0 ? (
                          fac.domains.map((d) => (
                            <span key={d.id} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-300">
                              {d.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No expertise domains mapped yet.</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        {domains.map((dom) => {
                          const isSelected = selectedDomainIds.includes(dom.id);
                          return (
                            <label
                              key={dom.id}
                              className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center space-x-2 transition ${
                                isSelected
                                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDomainIds([...selectedDomainIds, dom.id]);
                                  } else {
                                    setSelectedDomainIds(selectedDomainIds.filter(id => id !== dom.id));
                                  }
                                }}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                              />
                              <span className="truncate">{dom.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE DOMAIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 space-y-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Research Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDomain} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Domain Name</label>
                <input
                  type="text"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="e.g. Quantum Computing"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description</label>
                <textarea
                  value={newDomainDesc}
                  onChange={(e) => setNewDomainDesc(e.target.value)}
                  rows={3}
                  placeholder="Brief summary of domain focus area..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOMAIN MODAL */}
      {editingDomain && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 space-y-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Domain Details</h3>
              <button onClick={() => setEditingDomain(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDomain} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Domain Name</label>
                <input
                  type="text"
                  value={editingDomain.name}
                  onChange={(e) => setEditingDomain({ ...editingDomain, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description</label>
                <textarea
                  value={editingDomain.description || ''}
                  onChange={(e) => setEditingDomain({ ...editingDomain, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingDomain(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
