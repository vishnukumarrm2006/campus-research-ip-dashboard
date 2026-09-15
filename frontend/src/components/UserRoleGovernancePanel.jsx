import React, { useState, useEffect } from 'react';

const UserRoleGovernancePanel = ({ token, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role_id: 1, // Default STUDENT
    department: 'Computer Science & Engineering',
    roll_number: '',
    employee_id: '',
    designation: 'Assistant Professor',
  });

  useEffect(() => {
    fetchUsersAndStats();
  }, [roleFilter, statusFilter]);

  const fetchUsersAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams();
      if (roleFilter) params.append('role_id', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);

      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/system-stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) {
        setUsers(usersData.users || []);
      } else {
        setError(usersData.error || 'Failed to fetch registered users.');
      }

      if (statsData.success) {
        setSystemStats(statsData.system_health || null);
      }
    } catch (err) {
      setError('Connection error while fetching governance data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_id: parseInt(newRoleId, 10) }),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 4000);
        fetchUsersAndStats();
      } else {
        alert(data.error || 'Failed to reassign user role.');
      }
    } catch (err) {
      alert('Error updating user role: ' + err.message);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 4000);
        fetchUsersAndStats();
      } else {
        alert(data.error || 'Failed to toggle account status.');
      }
    } catch (err) {
      alert('Error changing status: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 4000);
        setShowModal(false);
        setFormData({
          full_name: '',
          email: '',
          password: '',
          role_id: 1,
          department: 'Computer Science & Engineering',
          roll_number: '',
          employee_id: '',
          designation: 'Assistant Professor',
        });
        fetchUsersAndStats();
      } else {
        setModalError(data.error || 'Failed to provision new user account.');
      }
    } catch (err) {
      setModalError('Network error registering account: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'STUDENT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'FACULTY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'IP_COORDINATOR':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.student_profile?.roll_number && u.student_profile.roll_number.toLowerCase().includes(q)) ||
      (u.faculty_profile?.employee_id && u.faculty_profile.employee_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex justify-between items-center animate-fade-in">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Glassmorphic System Health & Diagnostics Ribbon */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👑 Campus Governance & Access Management</span>
              <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono">
                ADMIN CONSOLE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Centralized user provisioning, RBAC privilege matrix, account suspension, and system runtime health diagnostics.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>➕ Provision New Account</span>
          </button>
        </div>

        {systemStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Users</span>
              <span className="text-xl font-bold text-amber-400 font-mono">{systemStats.total_users}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Projects</span>
              <span className="text-xl font-bold text-blue-400 font-mono">{systemStats.total_projects}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">IP Documents</span>
              <span className="text-xl font-bold text-purple-400 font-mono">{systemStats.total_documents}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Audit Scans</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{systemStats.total_ai_reports}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 col-span-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">DB Engine Mode</span>
              <span className="text-xs font-semibold text-emerald-300 block truncate">{systemStats.database_mode}</span>
            </div>
          </div>
        )}
      </div>

      {/* Master User Directory & Governance Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Campus User Directory</h3>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-mono">
              {filteredUsers.length} Accounts
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search user, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-500 w-full sm:w-48"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Roles</option>
              <option value="1">STUDENT (Role 1)</option>
              <option value="2">FACULTY (Role 2)</option>
              <option value="3">IP_COORDINATOR (Role 3)</option>
              <option value="4">ADMIN (Role 4)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading master user accounts...</div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No user accounts found matching query criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">User & Email</th>
                  <th className="py-3 px-3">Profile Identifiers</th>
                  <th className="py-3 px-3">Current Role & Reassign</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-3">Created Date</th>
                  <th className="py-3 px-3 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{user.full_name}</span>
                      <span className="text-slate-400 text-[11px] block">{user.email}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {user.student_profile && (
                        <div>
                          <span className="text-blue-400">Roll: {user.student_profile.roll_number}</span>
                          <span className="text-slate-500 block">{user.student_profile.department}</span>
                        </div>
                      )}
                      {user.faculty_profile && (
                        <div>
                          <span className="text-emerald-400">Emp ID: {user.faculty_profile.employee_id}</span>
                          <span className="text-slate-500 block">{user.faculty_profile.designation}</span>
                        </div>
                      )}
                      {user.coordinator_profile && (
                        <div>
                          <span className="text-purple-400">Emp ID: {user.coordinator_profile.employee_id}</span>
                          <span className="text-slate-500 block">{user.coordinator_profile.department}</span>
                        </div>
                      )}
                      {!user.student_profile && !user.faculty_profile && !user.coordinator_profile && (
                        <span className="text-slate-500">System Admin</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${getRoleBadgeStyle(user.role_name)}`}>
                          {user.role_name}
                        </span>

                        <select
                          value={user.role_id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="1">STUDENT</option>
                          <option value="2">FACULTY</option>
                          <option value="3">IP_COORDINATOR</option>
                          <option value="4">ADMIN</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.is_active)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition border ${
                          user.is_active
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>👤 Provision New Campus User</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Kumar"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@campus.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Role *</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>STUDENT</option>
                    <option value={2}>FACULTY</option>
                    <option value={3}>IP_COORDINATOR</option>
                    <option value={4}>ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {formData.role_id === 1 && (
                  <div className="col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Student Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024CSE099"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {(formData.role_id === 2 || formData.role_id === 3) && (
                  <>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Employee ID</label>
                      <input
                        type="text"
                        placeholder="e.g. EMP-FAC-0105"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    {formData.role_id === 2 && (
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Designation</label>
                        <input
                          type="text"
                          placeholder="e.g. Associate Professor"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end items-center gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
                >
                  {modalLoading ? 'Registering...' : 'Register User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleGovernancePanel;
