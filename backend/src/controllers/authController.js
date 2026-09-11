const { query, mockStore } = require('../config/db');
const { comparePassword, generateToken } = require('../utils/auth');

/**
 * Controller: User Login & JWT Generation
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both email and password.',
    });
  }

  try {
    // 1. Fetch user by email
    let user = null;
    const dbRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, r.name as role_name, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (dbRes.rows && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      // Fallback search in mockStore
      const mockUser = mockStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (mockUser) {
        const mockRole = mockStore.roles.find(r => r.id === mockUser.role_id);
        user = {
          ...mockUser,
          role_name: mockRole ? mockRole.name : 'STUDENT',
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: User email not found.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account disabled: Please contact administrator.',
      });
    }

    // 2. Validate Password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials: Incorrect password.',
      });
    }

    // 3. Retrieve Role-Specific Sub-Profile
    let profile = null;
    if (user.role_name === 'STUDENT') {
      profile = mockStore.students.find(s => s.id === user.id) || null;
    } else if (user.role_name === 'FACULTY') {
      profile = mockStore.faculty.find(f => f.id === user.id) || null;
    } else if (user.role_name === 'IP_COORDINATOR') {
      profile = mockStore.ip_coordinators.find(i => i.id === user.id) || null;
    }

    // 4. Generate JWT
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_name: user.role_name,
        role_id: user.role_id,
        profile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server login error: ' + error.message,
    });
  }
};

/**
 * Controller: Get Current User Profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    
    // Retrieve sub-profile
    let profile = null;
    if (user.role_name === 'STUDENT') {
      profile = mockStore.students.find(s => s.id === user.id) || null;
    } else if (user.role_name === 'FACULTY') {
      profile = mockStore.faculty.find(f => f.id === user.id) || null;
    } else if (user.role_name === 'IP_COORDINATOR') {
      profile = mockStore.ip_coordinators.find(i => i.id === user.id) || null;
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_name: user.role_name,
        role_id: user.role_id,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile: ' + error.message,
    });
  }
};

/**
 * Controller: Logout confirmation
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'User logged out successfully.',
  });
};

module.exports = {
  login,
  getMe,
  logout,
};
