import React, { useState, useEffect } from 'react';

const AuditTrailInspector = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedRole]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      let queryParams = new URLSearchParams();
      if (selectedRole) queryParams.append('role_name', selectedRole);

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      setError('Connection error while loading system audit trail.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'STUDENT': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'FACULTY': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'IP_COORDINATOR': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ADMIN': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.user_full_name && l.user_full_name.toLowerCase().includes(q)) ||
      (l.entity && l.entity.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🛡️ System Security & Audit Trail Inspector</span>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full">{filteredLogs.length} Events</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log recording every security, state change, and filing transition event.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search action, actor, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
          />

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
            <option value="IP_COORDINATOR">IP_COORDINATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading audit trail logs...</div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">{error}</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">No audit logs matching search filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor & Role</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity & ID</th>
                <th className="py-3 px-3">State Transition / Details</th>
                <th className="py-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition font-mono">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-white block">{log.user_full_name}</span>
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase ${getRoleBadge(log.role_name)}`}>
                      {log.role_name}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-amber-300 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                    {log.entity} #{log.entity_id}
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                    {log.new_value ? JSON.stringify(log.new_value) : 'N/A'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditTrailInspector;
