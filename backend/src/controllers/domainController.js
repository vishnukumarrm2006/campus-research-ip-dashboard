const { query, mockStore } = require('../config/db');

/**
 * Controller: Get All Research Domains
 * GET /api/domains
 */
const getDomains = async (req, res) => {
  try {
    let domains = [];
    const dbRes = await query(`
      SELECT d.id, d.name, d.description, d.is_active, d.created_at,
             COUNT(DISTINCT fd.faculty_id)::int as faculty_count,
             COUNT(DISTINCT p.id)::int as project_count
      FROM domains d
      LEFT JOIN faculty_domains fd ON d.id = fd.domain_id
      LEFT JOIN projects p ON d.id = p.domain_id
      GROUP BY d.id
      ORDER BY d.id ASC
    `);

    if (dbRes.rows && dbRes.rows.length > 0) {
      domains = dbRes.rows;
    } else {
      // Fallback from mockStore
      domains = mockStore.domains.map(d => {
        const facultyCount = mockStore.faculty_domains.filter(fd => fd.domain_id === d.id).length;
        const projectCount = mockStore.projects.filter(p => p.domain_id === d.id).length;
        return {
          ...d,
          faculty_count: facultyCount,
          project_count: projectCount,
        };
      });
    }

    return res.json({
      success: true,
      count: domains.length,
      domains,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch domains: ' + error.message,
    });
  }
};

/**
 * Controller: Get Domain by ID
 * GET /api/domains/:id
 */
const getDomainById = async (req, res) => {
  const domainId = parseInt(req.params.id, 10);
  if (isNaN(domainId)) {
    return res.status(400).json({ success: false, error: 'Invalid domain ID' });
  }

  try {
    let domain = mockStore.domains.find(d => d.id === domainId);
    if (!domain) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    // Get mapped faculty
    const mappedFacultyIds = mockStore.faculty_domains.filter(fd => fd.domain_id === domainId).map(fd => fd.faculty_id);
    const mappedFaculty = mockStore.faculty.filter(f => mappedFacultyIds.includes(f.id)).map(f => {
      const u = mockStore.users.find(usr => usr.id === f.id);
      return {
        ...f,
        full_name: u ? u.full_name : 'Faculty Member',
        email: u ? u.email : '',
      };
    });

    return res.json({
      success: true,
      domain: {
        ...domain,
        faculty: mappedFaculty,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Create New Domain (Admin Only)
 * POST /api/domains
 */
const createDomain = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Domain name is required.' });
  }

  try {
    // Check if domain already exists
    const existing = mockStore.domains.find(d => d.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: `Domain "${name}" already exists.` });
    }

    const newId = mockStore.domains.length > 0 ? Math.max(...mockStore.domains.map(d => d.id)) + 1 : 1;
    const newDomain = {
      id: newId,
      name: name.trim(),
      description: description ? description.trim() : '',
      is_active: true,
      created_at: new Date(),
    };

    mockStore.domains.push(newDomain);

    // Audit Log Entry
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'CREATE_DOMAIN',
      entity: 'DOMAIN',
      entity_id: newId,
      previous_value: null,
      new_value: newDomain,
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Domain "${newDomain.name}" created successfully.`,
      domain: newDomain,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create domain: ' + error.message });
  }
};

/**
 * Controller: Update Domain (Admin Only)
 * PUT /api/domains/:id
 */
const updateDomain = async (req, res) => {
  const domainId = parseInt(req.params.id, 10);
  const { name, description, is_active } = req.body;

  try {
    const domainIndex = mockStore.domains.findIndex(d => d.id === domainId);
    if (domainIndex === -1) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    const oldDomain = { ...mockStore.domains[domainIndex] };

    if (name) mockStore.domains[domainIndex].name = name.trim();
    if (description !== undefined) mockStore.domains[domainIndex].description = description.trim();
    if (is_active !== undefined) mockStore.domains[domainIndex].is_active = Boolean(is_active);

    const updatedDomain = mockStore.domains[domainIndex];

    // Audit log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'UPDATE_DOMAIN',
      entity: 'DOMAIN',
      entity_id: domainId,
      previous_value: oldDomain,
      new_value: updatedDomain,
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: 'Domain updated successfully',
      domain: updatedDomain,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Delete/Toggle Domain Status (Admin Only)
 * DELETE /api/domains/:id
 */
const deleteDomain = async (req, res) => {
  const domainId = parseInt(req.params.id, 10);

  try {
    const domainIndex = mockStore.domains.findIndex(d => d.id === domainId);
    if (domainIndex === -1) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    // Toggle active state or delete if no projects assigned
    const assignedProjects = mockStore.projects.filter(p => p.domain_id === domainId);
    if (assignedProjects.length > 0) {
      mockStore.domains[domainIndex].is_active = false;
      return res.json({
        success: true,
        message: `Domain has ${assignedProjects.length} existing project(s). Deactivated domain instead of hard deletion.`,
        domain: mockStore.domains[domainIndex],
      });
    }

    const removed = mockStore.domains.splice(domainIndex, 1)[0];

    return res.json({
      success: true,
      message: `Domain "${removed.name}" deleted successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
};
