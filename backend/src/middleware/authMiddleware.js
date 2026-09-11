const { verifyToken } = require('../utils/auth');
const { query, mockStore } = require('../config/db');

/**
 * Middleware: Verifies JWT token and attaches user details to req.user
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Missing token in Authorization header.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Invalid or expired JWT token.',
    });
  }

  try {
    // Attempt DB query for full user record
    const userRes = await query(
      `SELECT u.id, u.email, u.full_name, u.role_id, r.name as role_name, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    let user = userRes.rows[0];

    // Fallback to mockStore if database query yields no rows
    if (!user) {
      const mockUser = mockStore.users.find(u => u.id === decoded.id || u.email === decoded.email);
      if (mockUser) {
        const mockRole = mockStore.roles.find(r => r.id === mockUser.role_id);
        user = {
          ...mockUser,
          role_name: mockRole ? mockRole.name : decoded.role_name,
        };
      }
    }

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: User account is inactive or no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error: ' + error.message,
    });
  }
};

/**
 * Middleware: Role Authorization Gatekeeper (RBAC)
 * @param  {...string} allowedRoles Allowed role names (e.g. 'STUDENT', 'FACULTY', 'IP_COORDINATOR', 'ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: User role undefined.',
      });
    }

    const hasPermission = allowedRoles.includes(req.user.role_name);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role "${req.user.role_name}" does not have authorization to access this resource.`,
        requiredRoles: allowedRoles,
        userRole: req.user.role_name,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
