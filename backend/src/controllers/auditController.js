const { mockStore } = require('../config/db');

/**
 * Controller: Get System-wide Audit Logs (Admin Only)
 * GET /api/audit-logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const { action, role_name, search } = req.query;

    let logs = [...mockStore.audit_logs];

    // Filter by action
    if (action) {
      logs = logs.filter(l => l.action === action);
    }

    // Filter by role
    if (role_name) {
      logs = logs.filter(l => l.role_name === role_name);
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.entity && l.entity.toLowerCase().includes(q)) ||
        (l.role_name && l.role_name.toLowerCase().includes(q))
      );
    }

    // Enrich logs with user details
    const enrichedLogs = logs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(log => {
        const user = mockStore.users.find(u => u.id === log.user_id);
        return {
          ...log,
          user_full_name: user ? user.full_name : 'System User',
          user_email: user ? user.email : 'N/A',
        };
      });

    return res.json({
      success: true,
      count: enrichedLogs.length,
      logs: enrichedLogs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs: ' + error.message });
  }
};

module.exports = {
  getAuditLogs,
};
