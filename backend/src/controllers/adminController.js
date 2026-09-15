const bcrypt = require('bcryptjs');
const { mockStore } = require('../config/db');

/**
 * Controller: Get All Registered Users with Role & Profile Data (Admin Only)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { role_id, is_active, search } = req.query;

    let usersList = [...mockStore.users];

    // Filter by role
    if (role_id) {
      const rId = parseInt(role_id, 10);
      if (!isNaN(rId)) {
        usersList = usersList.filter(u => u.role_id === rId);
      }
    }

    // Filter by status
    if (is_active !== undefined && is_active !== '') {
      const activeBool = is_active === 'true' || is_active === true;
      usersList = usersList.filter(u => u.is_active === activeBool);
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      usersList = usersList.filter(u =>
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    // Enrich users with role name, student/faculty profile info
    const enrichedUsers = usersList.map(u => {
      const role = mockStore.roles.find(r => r.id === u.role_id);
      const student = mockStore.students.find(s => s.id === u.id);
      const faculty = mockStore.faculty.find(f => f.id === u.id);
      const coordinator = mockStore.ip_coordinators.find(c => c.id === u.id);

      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role_id: u.role_id,
        role_name: role ? role.name : 'UNKNOWN',
        is_active: u.is_active,
        created_at: u.created_at,
        student_profile: student || null,
        faculty_profile: faculty || null,
        coordinator_profile: coordinator || null,
      };
    });

    return res.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch users: ' + error.message });
  }
};

/**
 * Controller: Provision/Register New Campus User Account (Admin Only)
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  const { email, password, full_name, role_id, roll_number, department, employee_id, designation } = req.body;

  if (!email || !password || !full_name || !role_id) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, full name, and role are required.',
    });
  }

  try {
    // Check if email already exists
    const existing = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'User account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUserId = mockStore.users.length > 0 ? Math.max(...mockStore.users.map(u => u.id)) + 1 : 1;
    const rId = parseInt(role_id, 10);
    const role = mockStore.roles.find(r => r.id === rId);

    const newUser = {
      id: newUserId,
      email,
      password_hash,
      full_name,
      role_id: rId,
      is_active: true,
      created_at: new Date(),
    };

    mockStore.users.push(newUser);

    // Add role-specific profile entries
    if (role && role.name === 'STUDENT') {
      mockStore.students.push({
        id: newUserId,
        roll_number: roll_number || `2024CSE${String(newUserId).padStart(3, '0')}`,
        department: department || 'Computer Science & Engineering',
        batch_year: 2026,
        phone: '+91-9876543299',
      });
    } else if (role && role.name === 'FACULTY') {
      mockStore.faculty.push({
        id: newUserId,
        employee_id: employee_id || `EMP-FAC-${String(newUserId).padStart(4, '0')}`,
        department: department || 'Engineering',
        designation: designation || 'Assistant Professor',
        phone: '+91-9988776699',
        max_projects: 5,
      });
    } else if (role && role.name === 'IP_COORDINATOR') {
      mockStore.ip_coordinators.push({
        id: newUserId,
        employee_id: employee_id || `EMP-IP-${String(newUserId).padStart(4, '0')}`,
        department: 'Intellectual Property Cell',
        office_location: 'Innovation Complex, Room 101',
        phone: '+91-9123456799',
      });
    }

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'REGISTER_USER',
      entity: 'USER',
      entity_id: newUserId,
      previous_value: null,
      new_value: { email, full_name, role_name: role ? role.name : rId },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `User account for "${full_name}" registered successfully with role ${role ? role.name : rId}.`,
      user: {
        id: newUserId,
        email,
        full_name,
        role_id: rId,
        role_name: role ? role.name : 'UNKNOWN',
        is_active: true,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create user: ' + error.message });
  }
};

/**
 * Controller: Reassign User Role (Admin Only)
 * PUT /api/admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID.' });
  }

  const { role_id } = req.body;
  const rId = parseInt(role_id, 10);
  if (isNaN(rId)) {
    return res.status(400).json({ success: false, error: 'Valid role_id is required.' });
  }

  try {
    const userIndex = mockStore.users.findIndex(u => u.id === targetUserId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const previousRoleId = mockStore.users[userIndex].role_id;
    const previousRole = mockStore.roles.find(r => r.id === previousRoleId);
    const newRole = mockStore.roles.find(r => r.id === rId);

    if (!newRole) {
      return res.status(400).json({ success: false, error: 'Target role does not exist.' });
    }

    mockStore.users[userIndex].role_id = rId;

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'UPDATE_USER_ROLE',
      entity: 'USER',
      entity_id: targetUserId,
      previous_value: { role_id: previousRoleId, role_name: previousRole ? previousRole.name : previousRoleId },
      new_value: { role_id: rId, role_name: newRole.name },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `User "${mockStore.users[userIndex].full_name}" role reassigned from "${previousRole ? previousRole.name : previousRoleId}" to "${newRole.name}".`,
      user: {
        id: targetUserId,
        email: mockStore.users[userIndex].email,
        full_name: mockStore.users[userIndex].full_name,
        role_id: rId,
        role_name: newRole.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update user role: ' + error.message });
  }
};

/**
 * Controller: Toggle User Account Active Status (Admin Only)
 * PUT /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID.' });
  }

  const { is_active } = req.body;
  if (is_active === undefined) {
    return res.status(400).json({ success: false, error: 'is_active boolean state is required.' });
  }

  try {
    const userIndex = mockStore.users.findIndex(u => u.id === targetUserId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const previousStatus = mockStore.users[userIndex].is_active;
    const newStatus = Boolean(is_active);

    mockStore.users[userIndex].is_active = newStatus;

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entity: 'USER',
      entity_id: targetUserId,
      previous_value: { is_active: previousStatus },
      new_value: { is_active: newStatus },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `User "${mockStore.users[userIndex].full_name}" account is now ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.`,
      user: {
        id: targetUserId,
        full_name: mockStore.users[userIndex].full_name,
        is_active: newStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Get System Health & Database Diagnostics (Admin Only)
 * GET /api/admin/system-stats
 */
const getSystemStats = async (req, res) => {
  try {
    const rolesCount = mockStore.roles.map(r => ({
      role_name: r.name,
      user_count: mockStore.users.filter(u => u.role_id === r.id).length,
    }));

    return res.json({
      success: true,
      system_health: {
        database_mode: process.env.PG_HOST ? 'PostgreSQL Dual-Engine Connected' : 'In-Memory Fallback DB Engine Active',
        uptime_seconds: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        total_users: mockStore.users.length,
        total_projects: mockStore.projects.length,
        total_documents: mockStore.project_documents.length,
        total_ai_reports: mockStore.ai_screening_reports.length,
        users_by_role: rolesCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  getSystemStats,
};
