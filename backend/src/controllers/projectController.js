const { query, mockStore } = require('../config/db');

/**
 * Controller: Get Projects (Filtered by Role & Query Parameters)
 * GET /api/projects
 */
const getProjects = async (req, res) => {
  const { domain_id, status, search } = req.query;
  const user = req.user;

  try {
    let projects = [...mockStore.projects];

    // Role-Based Scope Filtering
    if (user.role_name === 'STUDENT') {
      // Students see projects where they are Lead or Team Member
      const studentMemberProjectIds = mockStore.project_members
        .filter(pm => pm.student_id === user.id)
        .map(pm => pm.project_id);

      projects = projects.filter(p => p.created_by_student_id === user.id || studentMemberProjectIds.includes(p.id));
    } else if (user.role_name === 'FACULTY') {
      // Faculty see projects assigned to them or matching their mapped domains
      const facultyDomainIds = mockStore.faculty_domains
        .filter(fd => fd.faculty_id === user.id)
        .map(fd => fd.domain_id);

      projects = projects.filter(p => p.assigned_faculty_id === user.id || facultyDomainIds.includes(p.domain_id));
    }

    // Query Filters
    if (domain_id) {
      const dId = parseInt(domain_id, 10);
      projects = projects.filter(p => p.domain_id === dId);
    }

    if (status) {
      projects = projects.filter(p => p.status.toUpperCase() === status.toUpperCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.abstract.toLowerCase().includes(q) ||
        p.technologies.toLowerCase().includes(q)
      );
    }

    // Populate metadata for each project
    const enrichedProjects = projects.map(p => {
      const domain = mockStore.domains.find(d => d.id === p.domain_id);
      const studentUser = mockStore.users.find(u => u.id === p.created_by_student_id);
      const studentProfile = mockStore.students.find(s => s.id === p.created_by_student_id);

      let facultyUser = null;
      if (p.assigned_faculty_id) {
        facultyUser = mockStore.users.find(u => u.id === p.assigned_faculty_id);
      }

      // Get team members
      const members = mockStore.project_members
        .filter(pm => pm.project_id === p.id)
        .map(pm => {
          const u = mockStore.users.find(usr => usr.id === pm.student_id);
          const s = mockStore.students.find(std => std.id === pm.student_id);
          return {
            student_id: pm.student_id,
            role_in_project: pm.role_in_project,
            full_name: u ? u.full_name : 'Student',
            email: u ? u.email : '',
            roll_number: s ? s.roll_number : '',
            department: s ? s.department : '',
          };
        });

      return {
        ...p,
        domain_name: domain ? domain.name : 'Unknown',
        creator: {
          id: p.created_by_student_id,
          full_name: studentUser ? studentUser.full_name : 'Student Creator',
          roll_number: studentProfile ? studentProfile.roll_number : '',
          department: studentProfile ? studentProfile.department : '',
        },
        assigned_faculty: facultyUser ? {
          id: p.assigned_faculty_id,
          full_name: facultyUser.full_name,
          email: facultyUser.email,
        } : null,
        team_members: members,
      };
    });

    return res.json({
      success: true,
      count: enrichedProjects.length,
      projects: enrichedProjects,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch projects: ' + error.message });
  }
};

/**
 * Controller: Get Project by ID (Complete Profile & History)
 * GET /api/projects/:id
 */
const getProjectById = async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const domain = mockStore.domains.find(d => d.id === project.domain_id);
    const creatorUser = mockStore.users.find(u => u.id === project.created_by_student_id);
    const creatorProfile = mockStore.students.find(s => s.id === project.created_by_student_id);
    const facultyUser = project.assigned_faculty_id ? mockStore.users.find(u => u.id === project.assigned_faculty_id) : null;
    const facultyProfile = project.assigned_faculty_id ? mockStore.faculty.find(f => f.id === project.assigned_faculty_id) : null;

    // Team Members
    const teamMembers = mockStore.project_members
      .filter(pm => pm.project_id === projectId)
      .map(pm => {
        const u = mockStore.users.find(usr => usr.id === pm.student_id);
        const s = mockStore.students.find(std => std.id === pm.student_id);
        return {
          id: pm.id,
          student_id: pm.student_id,
          role_in_project: pm.role_in_project,
          full_name: u ? u.full_name : 'Student',
          email: u ? u.email : '',
          roll_number: s ? s.roll_number : '',
          department: s ? s.department : '',
          batch_year: s ? s.batch_year : 2026,
        };
      });

    // Milestones
    const milestones = mockStore.project_milestones
      .filter(m => m.project_id === projectId)
      .sort((a, b) => a.sequence_order - b.sequence_order);

    // Documents
    const documents = mockStore.project_documents
      .filter(d => d.project_id === projectId);

    // AI Report
    const aiReport = mockStore.ai_screening_reports.find(a => a.project_id === projectId) || null;
    let similarityMatches = [];
    if (aiReport) {
      similarityMatches = mockStore.similarity_results.filter(sr => sr.ai_report_id === aiReport.id);
    }

    // IP Review
    const ipReview = mockStore.ip_reviews.find(r => r.project_id === projectId) || null;
    const ipHistory = mockStore.ip_status_history.filter(h => h.project_id === projectId);

    // Faculty Feedbacks
    const feedbacks = mockStore.faculty_feedback.filter(f => f.project_id === projectId);

    return res.json({
      success: true,
      project: {
        ...project,
        domain,
        creator: {
          id: project.created_by_student_id,
          full_name: creatorUser ? creatorUser.full_name : 'Student',
          email: creatorUser ? creatorUser.email : '',
          roll_number: creatorProfile ? creatorProfile.roll_number : '',
          department: creatorProfile ? creatorProfile.department : '',
        },
        assigned_faculty: facultyUser ? {
          id: project.assigned_faculty_id,
          full_name: facultyUser.full_name,
          email: facultyUser.email,
          designation: facultyProfile ? facultyProfile.designation : '',
          department: facultyProfile ? facultyProfile.department : '',
        } : null,
        team_members: teamMembers,
        milestones,
        documents,
        ai_screening_report: aiReport ? { ...aiReport, matches: similarityMatches } : null,
        ip_review: ipReview,
        ip_status_history: ipHistory,
        faculty_feedbacks: feedbacks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Create Project (Student Role)
 * POST /api/projects
 */
const createProject = async (req, res) => {
  const {
    title,
    abstract,
    problem_statement,
    objectives,
    methodology,
    technologies,
    features,
    innovation_description,
    domain_id,
  } = req.body;

  if (!title || !abstract || !problem_statement || !objectives || !methodology || !technologies || !domain_id) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in all required project fields (title, abstract, problem statement, objectives, methodology, technologies, domain).',
    });
  }

  const domainId = parseInt(domain_id, 10);
  const domain = mockStore.domains.find(d => d.id === domainId && d.is_active);
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Selected research domain is invalid or inactive.' });
  }

  try {
    const studentId = req.user.id;
    const newProjectId = mockStore.projects.length > 0 ? Math.max(...mockStore.projects.map(p => p.id)) + 1 : 1;

    // Check if faculty is available in domain to auto-assign
    const facultyDomainMappings = mockStore.faculty_domains.filter(fd => fd.domain_id === domainId);
    let assignedFacultyId = null;
    for (const mapping of facultyDomainMappings) {
      const f = mockStore.faculty.find(fac => fac.id === mapping.faculty_id);
      if (f) {
        const count = mockStore.projects.filter(p => p.assigned_faculty_id === f.id).length;
        if (count < (f.max_projects || 5)) {
          assignedFacultyId = f.id;
          break;
        }
      }
    }

    const newProject = {
      id: newProjectId,
      title: title.trim(),
      abstract: abstract.trim(),
      problem_statement: problem_statement.trim(),
      objectives: objectives.trim(),
      methodology: methodology.trim(),
      technologies: technologies.trim(),
      features: features ? features.trim() : '',
      innovation_description: innovation_description ? innovation_description.trim() : '',
      domain_id: domainId,
      created_by_student_id: studentId,
      assigned_faculty_id: assignedFacultyId,
      status: 'DRAFT',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockStore.projects.push(newProject);

    // Register creator as LEAD in project_members
    mockStore.project_members.push({
      id: mockStore.project_members.length + 1,
      project_id: newProjectId,
      student_id: studentId,
      role_in_project: 'LEAD',
      created_at: new Date(),
    });

    // Create 3 standard default milestones
    mockStore.project_milestones.push(
      { id: mockStore.project_milestones.length + 1, project_id: newProjectId, title: 'Literature Survey & Design Specs', description: 'Complete prior-art review and hardware/software design architecture.', sequence_order: 1, due_date: new Date(Date.now() + 14 * 86400000), status: 'PENDING', created_at: new Date(), updated_at: new Date() },
      { id: mockStore.project_milestones.length + 2, project_id: newProjectId, title: 'Prototype Implementation & Integration', description: 'Core functional prototype execution and validation.', sequence_order: 2, due_date: new Date(Date.now() + 30 * 86400000), status: 'PENDING', created_at: new Date(), updated_at: new Date() },
      { id: mockStore.project_milestones.length + 3, project_id: newProjectId, title: 'Final Report & Invention Disclosure', description: 'Final project report submission and IP disclosure draft.', sequence_order: 3, due_date: new Date(Date.now() + 45 * 86400000), status: 'PENDING', created_at: new Date(), updated_at: new Date() }
    );

    // Audit log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: studentId,
      role_name: req.user.role_name,
      action: 'CREATE_PROJECT',
      entity: 'PROJECT',
      entity_id: newProjectId,
      previous_value: null,
      new_value: newProject,
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Project "${newProject.title}" created successfully in DRAFT status.`,
      project: newProject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create project: ' + error.message });
  }
};

/**
 * Controller: Update Project Details (Draft / Revision Requested)
 * PUT /api/projects/:id
 */
const updateProject = async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const {
    title, abstract, problem_statement, objectives,
    methodology, technologies, features, innovation_description, domain_id
  } = req.body;

  try {
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = mockStore.projects[projectIndex];

    // Authorization: User must be creator/lead or Admin
    if (req.user.role_name === 'STUDENT' && project.created_by_student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You are not the Lead of this project.' });
    }

    // Editable states: DRAFT or REVISION_REQUESTED
    if (!['DRAFT', 'REVISION_REQUESTED'].includes(project.status) && req.user.role_name !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: `Projects in "${project.status}" status cannot be modified.`,
      });
    }

    const oldProject = { ...project };

    if (title) project.title = title.trim();
    if (abstract) project.abstract = abstract.trim();
    if (problem_statement) project.problem_statement = problem_statement.trim();
    if (objectives) project.objectives = objectives.trim();
    if (methodology) project.methodology = methodology.trim();
    if (technologies) project.technologies = technologies.trim();
    if (features !== undefined) project.features = features.trim();
    if (innovation_description !== undefined) project.innovation_description = innovation_description.trim();
    if (domain_id) project.domain_id = parseInt(domain_id, 10);
    project.updated_at = new Date();

    mockStore.projects[projectIndex] = project;

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Add Team Member to Project
 * POST /api/projects/:id/members
 */
const addTeamMember = async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { student_id, roll_number } = req.body;

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Find student by ID or roll number
    let targetStudent = null;
    if (student_id) {
      targetStudent = mockStore.students.find(s => s.id === parseInt(student_id, 10));
    } else if (roll_number) {
      targetStudent = mockStore.students.find(s => s.roll_number.toLowerCase() === roll_number.trim().toLowerCase());
    }

    if (!targetStudent) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    // Check if already a member
    const existing = mockStore.project_members.find(pm => pm.project_id === projectId && pm.student_id === targetStudent.id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Student is already a member of this project.' });
    }

    const newMember = {
      id: mockStore.project_members.length + 1,
      project_id: projectId,
      student_id: targetStudent.id,
      role_in_project: 'MEMBER',
      created_at: new Date(),
    };

    mockStore.project_members.push(newMember);

    const user = mockStore.users.find(u => u.id === targetStudent.id);

    return res.status(201).json({
      success: true,
      message: `Student "${user?.full_name}" (${targetStudent.roll_number}) added to project team.`,
      member: {
        ...newMember,
        full_name: user?.full_name,
        roll_number: targetStudent.roll_number,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Remove Team Member from Project
 * DELETE /api/projects/:id/members/:studentId
 */
const removeTeamMember = async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const targetStudentId = parseInt(req.params.studentId, 10);

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (project.created_by_student_id === targetStudentId) {
      return res.status(400).json({ success: false, error: 'Cannot remove Project Lead from project team.' });
    }

    const memberIndex = mockStore.project_members.findIndex(pm => pm.project_id === projectId && pm.student_id === targetStudentId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, error: 'Team member not found in project.' });
    }

    mockStore.project_members.splice(memberIndex, 1);

    return res.json({
      success: true,
      message: 'Team member removed from project.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Submit Project for Faculty Review
 * POST /api/projects/:id/submit
 */
const submitProject = async (req, res) => {
  const projectId = parseInt(req.params.id, 10);

  try {
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = mockStore.projects[projectIndex];

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(project.status)) {
      return res.status(400).json({ success: false, error: `Project is already in "${project.status}" status.` });
    }

    const nextStatus = project.assigned_faculty_id ? 'UNDER_FACULTY_REVIEW' : 'SUBMITTED';
    mockStore.projects[projectIndex].status = nextStatus;
    mockStore.projects[projectIndex].updated_at = new Date();

    // Send Notification to Lead Student
    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: project.created_by_student_id,
      title: 'Project Submitted for Review',
      message: `Your project "${project.title}" has been submitted for faculty review.`,
      type: 'PROJECT_SUBMISSION',
      entity_type: 'PROJECT',
      entity_id: projectId,
      is_read: false,
      created_at: new Date(),
    });

    // Notify assigned faculty if present
    if (project.assigned_faculty_id) {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: project.assigned_faculty_id,
        title: 'New Student Project Submission',
        message: `Project "${project.title}" submitted and awaiting your review.`,
        type: 'PROJECT_SUBMISSION',
        entity_type: 'PROJECT',
        entity_id: projectId,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.json({
      success: true,
      message: `Project submitted successfully. Status updated to ${nextStatus}.`,
      project: mockStore.projects[projectIndex],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Search Students for Team Addition
 * GET /api/projects/students/search?q=query
 */
const searchStudents = async (req, res) => {
  const { q } = req.query;
  try {
    const queryStr = (q || '').trim().toLowerCase();
    const students = mockStore.students.map(s => {
      const u = mockStore.users.find(usr => usr.id === s.id);
      return {
        id: s.id,
        full_name: u ? u.full_name : 'Student',
        email: u ? u.email : '',
        roll_number: s.roll_number,
        department: s.department,
      };
    }).filter(s => 
      !queryStr || 
      s.full_name.toLowerCase().includes(queryStr) || 
      s.roll_number.toLowerCase().includes(queryStr) ||
      s.email.toLowerCase().includes(queryStr)
    );

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addTeamMember,
  removeTeamMember,
  submitProject,
  searchStudents,
};
