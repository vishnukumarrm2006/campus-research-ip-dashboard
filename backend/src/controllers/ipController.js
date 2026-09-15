const { query, mockStore } = require('../config/db');

const FILING_STAGES = [
  'NOT_EVALUATED',
  'AI_SCREENED',
  'RECOMMENDED_FOR_IP_REVIEW',
  'UNDER_IP_EVALUATION',
  'REJECTED_FOR_FILING',
  'PATENT_DRAFTING_IN_PROGRESS',
  'PATENT_FILED',
  'PATENT_PUBLISHED',
  'EXAMINATION_REQUESTED',
  'PATENT_GRANTED'
];

/**
 * Controller: Get IP Project Queue for IP Coordinator & Admin
 * GET /api/ip/projects
 */
const getIpProjectQueue = async (req, res) => {
  try {
    const { domain_id, status, search } = req.query;

    let filteredProjects = [...mockStore.projects];

    // Filter by domain
    if (domain_id) {
      const dId = parseInt(domain_id, 10);
      if (!isNaN(dId)) {
        filteredProjects = filteredProjects.filter(p => p.domain_id === dId);
      }
    }

    // Filter by status
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    // Search by title or abstract
    if (search) {
      const queryLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        (p.title && p.title.toLowerCase().includes(queryLower)) ||
        (p.abstract && p.abstract.toLowerCase().includes(queryLower)) ||
        (p.problem_statement && p.problem_statement.toLowerCase().includes(queryLower))
      );
    }

    // Enrich project items with domain name, student, faculty, AI report metrics, documents
    const queueData = filteredProjects.map(project => {
      const domain = mockStore.domains.find(d => d.id === project.domain_id);
      const studentUser = mockStore.users.find(u => u.id === project.created_by_student_id);
      const studentProfile = mockStore.students.find(s => s.id === project.created_by_student_id);
      const facultyUser = mockStore.users.find(u => u.id === project.assigned_faculty_id);
      
      const aiReport = mockStore.ai_screening_reports.find(r => r.project_id === project.id);
      const docs = mockStore.project_documents.filter(d => d.project_id === project.id);
      const ipReview = mockStore.ip_reviews.find(r => r.project_id === project.id);

      return {
        ...project,
        domain_name: domain ? domain.name : 'Unknown',
        student_name: studentUser ? studentUser.full_name : 'Unknown Student',
        student_roll_number: studentProfile ? studentProfile.roll_number : 'N/A',
        student_department: studentProfile ? studentProfile.department : 'N/A',
        faculty_name: facultyUser ? facultyUser.full_name : 'Unassigned',
        ai_screening: aiReport ? {
          id: aiReport.id,
          similarity_score: aiReport.similarity_score,
          confidence_score: aiReport.confidence_score,
          recommendation: aiReport.recommendation,
          created_at: aiReport.created_at,
        } : null,
        document_counts: {
          total: docs.length,
          invention_disclosure: docs.filter(d => d.document_type === 'INVENTION_DISCLOSURE').length,
        },
        ip_review: ipReview || null,
      };
    });

    return res.json({
      success: true,
      count: queueData.length,
      stages: FILING_STAGES,
      projects: queueData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch IP project queue: ' + error.message });
  }
};

/**
 * Controller: Get Full IP Dossier for a specific project
 * GET /api/ip/projects/:projectId
 */
const getIpDossier = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const domain = mockStore.domains.find(d => d.id === project.domain_id);
    const studentUser = mockStore.users.find(u => u.id === project.created_by_student_id);
    const studentProfile = mockStore.students.find(s => s.id === project.created_by_student_id);
    const facultyUser = mockStore.users.find(u => u.id === project.assigned_faculty_id);

    // Fetch Team Roster
    const members = mockStore.project_members
      .filter(m => m.project_id === projectId)
      .map(m => {
        const u = mockStore.users.find(usr => usr.id === m.student_id);
        const s = mockStore.students.find(std => std.id === m.student_id);
        return {
          id: m.id,
          student_id: m.student_id,
          full_name: u ? u.full_name : 'Unknown',
          email: u ? u.email : 'Unknown',
          roll_number: s ? s.roll_number : 'N/A',
          department: s ? s.department : 'N/A',
          role_in_project: m.role_in_project,
        };
      });

    // Fetch Documents
    const documents = mockStore.project_documents
      .filter(d => d.project_id === projectId)
      .map(doc => {
        const uploader = mockStore.users.find(u => u.id === doc.uploaded_by_user_id);
        return {
          ...doc,
          uploaded_by_name: uploader ? uploader.full_name : 'System User',
        };
      });

    // Fetch AI Report + Matched Sources
    const aiReport = mockStore.ai_screening_reports.find(r => r.project_id === projectId);
    let matchedSources = [];
    if (aiReport) {
      matchedSources = mockStore.similarity_results.filter(sr => sr.ai_report_id === aiReport.id);
    }

    // Fetch Existing IP Review
    const ipReview = mockStore.ip_reviews.find(r => r.project_id === projectId) || null;

    // Fetch History
    const history = mockStore.ip_status_history
      .filter(h => h.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(h => {
        const user = mockStore.users.find(u => u.id === h.changed_by_user_id);
        const role = user ? mockStore.roles.find(r => r.id === user.role_id) : null;
        return {
          ...h,
          changed_by_name: user ? user.full_name : 'System User',
          changed_by_role: role ? role.name : 'USER',
        };
      });

    return res.json({
      success: true,
      dossier: {
        project: {
          ...project,
          domain_name: domain ? domain.name : 'Unknown',
          student_name: studentUser ? studentUser.full_name : 'Unknown',
          student_roll_number: studentProfile ? studentProfile.roll_number : 'N/A',
          student_email: studentUser ? studentUser.email : 'N/A',
          student_department: studentProfile ? studentProfile.department : 'N/A',
          faculty_name: facultyUser ? facultyUser.full_name : 'Unassigned',
          faculty_email: facultyUser ? facultyUser.email : 'N/A',
        },
        team_members: members,
        documents,
        ai_screening_report: aiReport ? { ...aiReport, matched_sources: matchedSources } : null,
        ip_review: ipReview,
        filing_history: history,
        available_stages: FILING_STAGES,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve IP dossier: ' + error.message });
  }
};

/**
 * Controller: Update Project Filing Status (10-Stage Lifecycle)
 * POST /api/ip/projects/:projectId/status
 */
const updateIpStatus = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  const {
    status,
    evaluation_notes,
    novelty_assessment,
    commercial_potential,
    patentability_notes,
    recommended_action,
    docket_number,
    application_number,
    filing_date,
    publication_number,
    grant_number,
  } = req.body;

  if (!status || !FILING_STAGES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status "${status}". Allowed values: ${FILING_STAGES.join(', ')}`,
    });
  }

  if (!evaluation_notes || evaluation_notes.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Evaluation notes/comments are required when updating IP status.',
    });
  }

  try {
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const previousStatus = mockStore.projects[projectIndex].status;

    // Update project status
    mockStore.projects[projectIndex].status = status;
    mockStore.projects[projectIndex].updated_at = new Date();

    // Create or Update IP Review record
    let reviewIndex = mockStore.ip_reviews.findIndex(r => r.project_id === projectId);
    let reviewId = null;

    if (reviewIndex !== -1) {
      reviewId = mockStore.ip_reviews[reviewIndex].id;
      mockStore.ip_reviews[reviewIndex] = {
        ...mockStore.ip_reviews[reviewIndex],
        ip_coordinator_id: req.user.id,
        novelty_assessment: novelty_assessment || mockStore.ip_reviews[reviewIndex].novelty_assessment || evaluation_notes,
        commercial_potential: commercial_potential || mockStore.ip_reviews[reviewIndex].commercial_potential || 'Under Commercial Evaluation',
        patentability_notes: patentability_notes || evaluation_notes,
        recommended_action: recommended_action || status,
        final_evaluation_status: status,
        docket_number: docket_number || mockStore.ip_reviews[reviewIndex].docket_number || `IP-${new Date().getFullYear()}-PAT-${String(projectId).padStart(4, '0')}`,
        application_number: application_number || mockStore.ip_reviews[reviewIndex].application_number || null,
        filing_date: filing_date || mockStore.ip_reviews[reviewIndex].filing_date || null,
        publication_number: publication_number || mockStore.ip_reviews[reviewIndex].publication_number || null,
        grant_number: grant_number || mockStore.ip_reviews[reviewIndex].grant_number || null,
        updated_at: new Date(),
      };
    } else {
      reviewId = mockStore.ip_reviews.length > 0 ? Math.max(...mockStore.ip_reviews.map(r => r.id)) + 1 : 1;
      const newReview = {
        id: reviewId,
        project_id: projectId,
        ip_coordinator_id: req.user.id,
        novelty_assessment: novelty_assessment || evaluation_notes,
        commercial_potential: commercial_potential || 'Under Commercial Evaluation',
        patentability_notes: patentability_notes || evaluation_notes,
        recommended_action: recommended_action || status,
        final_evaluation_status: status,
        docket_number: docket_number || `IP-${new Date().getFullYear()}-PAT-${String(projectId).padStart(4, '0')}`,
        application_number: application_number || null,
        filing_date: filing_date || null,
        publication_number: publication_number || null,
        grant_number: grant_number || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockStore.ip_reviews.push(newReview);
    }

    // Append to IP Status History
    const historyId = mockStore.ip_status_history.length > 0 ? Math.max(...mockStore.ip_status_history.map(h => h.id)) + 1 : 1;
    const historyItem = {
      id: historyId,
      project_id: projectId,
      changed_by_user_id: req.user.id,
      previous_status: previousStatus,
      new_status: status,
      comments: evaluation_notes,
      created_at: new Date(),
    };
    mockStore.ip_status_history.push(historyItem);

    // Send Event Notifications
    const project = mockStore.projects[projectIndex];
    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: project.created_by_student_id,
      title: 'IP Patent Lifecycle Status Updated 🏛️',
      message: `Project "${project.title}" IP status transitioned to "${status.replace(/_/g, ' ')}". Notes: ${evaluation_notes}`,
      type: 'IP_STATUS_UPDATE',
      entity_type: 'PROJECT',
      entity_id: projectId,
      is_read: false,
      created_at: new Date(),
    });

    if (project.assigned_faculty_id) {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: project.assigned_faculty_id,
        title: 'IP Coordinator Status Update',
        message: `IP filing status for "${project.title}" updated to "${status.replace(/_/g, ' ')}".`,
        type: 'IP_STATUS_UPDATE',
        entity_type: 'PROJECT',
        entity_id: projectId,
        is_read: false,
        created_at: new Date(),
      });
    }

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'UPDATE_IP_STATUS',
      entity: 'PROJECT',
      entity_id: projectId,
      previous_value: { status: previousStatus },
      new_value: { status, comments: evaluation_notes, docket_number: docket_number || null },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Project IP status updated successfully from "${previousStatus}" to "${status}".`,
      ip_review: mockStore.ip_reviews.find(r => r.id === reviewId),
      project_status: status,
      history_entry: historyItem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update IP status: ' + error.message });
  }
};

/**
 * Controller: Get IP History Timeline
 * GET /api/ip/projects/:projectId/history
 */
const getIpHistory = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const history = mockStore.ip_status_history
      .filter(h => h.project_id === projectId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(h => {
        const user = mockStore.users.find(u => u.id === h.changed_by_user_id);
        const role = user ? mockStore.roles.find(r => r.id === user.role_id) : null;
        return {
          ...h,
          changed_by_name: user ? user.full_name : 'System User',
          changed_by_role: role ? role.name : 'USER',
        };
      });

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getIpProjectQueue,
  getIpDossier,
  updateIpStatus,
  getIpHistory,
  FILING_STAGES,
};
