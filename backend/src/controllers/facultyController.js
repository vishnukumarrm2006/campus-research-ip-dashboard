const { query, mockStore } = require('../config/db');

/**
 * Controller: Get All Faculty Members with Mapped Domains & Workload Stats
 * GET /api/faculty
 */
const getAllFaculty = async (req, res) => {
  try {
    const facultyList = mockStore.faculty.map(f => {
      const user = mockStore.users.find(u => u.id === f.id);
      
      // Get mapped domain IDs and full domain objects
      const domainMappings = mockStore.faculty_domains.filter(fd => fd.faculty_id === f.id);
      const domains = domainMappings.map(fd => mockStore.domains.find(d => d.id === fd.domain_id)).filter(Boolean);

      // Get assigned project count
      const assignedProjects = mockStore.projects.filter(p => p.assigned_faculty_id === f.id);
      const activeProjectCount = assignedProjects.length;

      return {
        id: f.id,
        employee_id: f.employee_id,
        full_name: user ? user.full_name : 'Faculty Member',
        email: user ? user.email : '',
        department: f.department,
        designation: f.designation,
        phone: f.phone,
        max_projects: f.max_projects || 5,
        current_projects_count: activeProjectCount,
        available_capacity: (f.max_projects || 5) - activeProjectCount,
        domains,
        assigned_projects: assignedProjects.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          domain_id: p.domain_id,
        })),
      };
    });

    return res.json({
      success: true,
      count: facultyList.length,
      faculty: facultyList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch faculty list: ' + error.message });
  }
};

/**
 * Controller: Get Faculty Members by Research Domain
 * GET /api/faculty/domain/:domainId
 */
const getFacultyByDomain = async (req, res) => {
  const domainId = parseInt(req.params.domainId, 10);
  if (isNaN(domainId)) {
    return res.status(400).json({ success: false, error: 'Invalid domain ID' });
  }

  try {
    const facultyDomainMappings = mockStore.faculty_domains.filter(fd => fd.domain_id === domainId);
    const facultyIds = facultyDomainMappings.map(fd => fd.faculty_id);

    const matchingFaculty = mockStore.faculty
      .filter(f => facultyIds.includes(f.id))
      .map(f => {
        const user = mockStore.users.find(u => u.id === f.id);
        const assignedProjects = mockStore.projects.filter(p => p.assigned_faculty_id === f.id);
        const currentCount = assignedProjects.length;

        return {
          id: f.id,
          employee_id: f.employee_id,
          full_name: user ? user.full_name : 'Faculty Member',
          email: user ? user.email : '',
          department: f.department,
          designation: f.designation,
          max_projects: f.max_projects || 5,
          current_projects_count: currentCount,
          available_capacity: (f.max_projects || 5) - currentCount,
          is_available: currentCount < (f.max_projects || 5),
        };
      })
      .sort((a, b) => b.available_capacity - a.available_capacity); // Rank by available capacity

    return res.json({
      success: true,
      domain_id: domainId,
      count: matchingFaculty.length,
      faculty: matchingFaculty,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Update Faculty Domain Mappings (Admin Only)
 * POST /api/faculty/:id/domains
 */
const updateFacultyDomains = async (req, res) => {
  const facultyId = parseInt(req.params.id, 10);
  const { domain_ids } = req.body;

  if (!Array.isArray(domain_ids)) {
    return res.status(400).json({ success: false, error: 'domain_ids must be an array of domain IDs.' });
  }

  try {
    const faculty = mockStore.faculty.find(f => f.id === facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty member not found.' });
    }

    // Remove existing domain mappings for this faculty
    const oldMappings = mockStore.faculty_domains.filter(fd => fd.faculty_id === facultyId);
    mockStore.faculty_domains = mockStore.faculty_domains.filter(fd => fd.faculty_id !== facultyId);

    // Insert new mappings
    domain_ids.forEach(dId => {
      const validDomain = mockStore.domains.find(d => d.id === dId);
      if (validDomain) {
        mockStore.faculty_domains.push({
          id: mockStore.faculty_domains.length + 1,
          faculty_id: facultyId,
          domain_id: dId,
          created_at: new Date(),
        });
      }
    });

    const updatedDomains = mockStore.faculty_domains
      .filter(fd => fd.faculty_id === facultyId)
      .map(fd => mockStore.domains.find(d => d.id === fd.domain_id));

    // Audit log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'UPDATE_FACULTY_DOMAINS',
      entity: 'FACULTY',
      entity_id: facultyId,
      previous_value: oldMappings,
      new_value: updatedDomains,
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: 'Faculty domain expertise mapping updated successfully.',
      faculty_id: facultyId,
      domains: updatedDomains,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Update Faculty Workload Threshold (Admin Only)
 * PUT /api/faculty/:id/workload
 */
const updateFacultyWorkload = async (req, res) => {
  const facultyId = parseInt(req.params.id, 10);
  const { max_projects } = req.body;

  const maxVal = parseInt(max_projects, 10);
  if (isNaN(maxVal) || maxVal < 1) {
    return res.status(400).json({ success: false, error: 'max_projects must be a positive integer >= 1.' });
  }

  try {
    const facultyIndex = mockStore.faculty.findIndex(f => f.id === facultyId);
    if (facultyIndex === -1) {
      return res.status(404).json({ success: false, error: 'Faculty member not found.' });
    }

    const prevVal = mockStore.faculty[facultyIndex].max_projects;
    mockStore.faculty[facultyIndex].max_projects = maxVal;

    return res.json({
      success: true,
      message: `Max projects workload limit updated from ${prevVal} to ${maxVal}.`,
      faculty: mockStore.faculty[facultyIndex],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Assign Faculty to Student Project (Admin / System)
 * POST /api/faculty/assign-project
 */
const assignFacultyToProject = async (req, res) => {
  const { project_id, faculty_id } = req.body;

  const projectId = parseInt(project_id, 10);
  const facultyId = parseInt(faculty_id, 10);

  if (isNaN(projectId) || isNaN(facultyId)) {
    return res.status(400).json({ success: false, error: 'Please provide valid project_id and faculty_id.' });
  }

  try {
    // 1. Verify Project
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }
    const project = mockStore.projects[projectIndex];

    // 2. Verify Faculty
    const faculty = mockStore.faculty.find(f => f.id === facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, error: 'Faculty member not found.' });
    }

    const facultyUser = mockStore.users.find(u => u.id === facultyId);

    // 3. Check Workload Capacity
    const currentCount = mockStore.projects.filter(p => p.assigned_faculty_id === facultyId).length;
    if (currentCount >= (faculty.max_projects || 5)) {
      return res.status(400).json({
        success: false,
        error: `Faculty member "${facultyUser?.full_name}" has reached max project workload limit (${currentCount}/${faculty.max_projects}).`,
      });
    }

    // 4. Update Project Assignment & Status
    const prevFacultyId = project.assigned_faculty_id;
    mockStore.projects[projectIndex].assigned_faculty_id = facultyId;
    if (project.status === 'SUBMITTED' || project.status === 'DRAFT') {
      mockStore.projects[projectIndex].status = 'UNDER_FACULTY_REVIEW';
    }

    // 5. Send Notifications
    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: facultyId,
      title: 'New Project Assigned for Mentorship',
      message: `You have been assigned as faculty mentor for student research project: "${project.title}".`,
      type: 'FACULTY_ASSIGNMENT',
      entity_type: 'PROJECT',
      entity_id: projectId,
      is_read: false,
      created_at: new Date(),
    });

    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: project.created_by_student_id,
      title: 'Faculty Mentor Assigned',
      message: `Faculty mentor ${facultyUser?.full_name} has been assigned to your project "${project.title}".`,
      type: 'FACULTY_ASSIGNMENT',
      entity_type: 'PROJECT',
      entity_id: projectId,
      is_read: false,
      created_at: new Date(),
    });

    // 6. Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'ASSIGN_FACULTY_PROJECT',
      entity: 'PROJECT',
      entity_id: projectId,
      previous_value: { assigned_faculty_id: prevFacultyId },
      new_value: { assigned_faculty_id: facultyId, faculty_name: facultyUser?.full_name },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `Faculty mentor ${facultyUser?.full_name} assigned to project "${project.title}" successfully.`,
      project: mockStore.projects[projectIndex],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyByDomain,
  updateFacultyDomains,
  updateFacultyWorkload,
  assignFacultyToProject,
};
