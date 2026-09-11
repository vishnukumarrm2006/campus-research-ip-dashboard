const { query, mockStore } = require('../config/db');

/**
 * Controller: Get All Milestones for a Project (with Submissions & Feedbacks)
 * GET /api/projects/:projectId/milestones
 */
const getProjectMilestones = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const milestones = mockStore.project_milestones
      .filter(m => m.project_id === projectId)
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map(m => {
        const submissions = mockStore.milestone_submissions
          .filter(ms => ms.milestone_id === m.id)
          .map(ms => {
            const studentUser = mockStore.users.find(u => u.id === ms.submitted_by_student_id);
            const studentProfile = mockStore.students.find(s => s.id === ms.submitted_by_student_id);
            return {
              ...ms,
              student_name: studentUser ? studentUser.full_name : 'Student',
              roll_number: studentProfile ? studentProfile.roll_number : '',
            };
          });

        const feedbacks = mockStore.faculty_feedback
          .filter(ff => ff.milestone_id === m.id)
          .map(ff => {
            const facultyUser = mockStore.users.find(u => u.id === ff.faculty_id);
            return {
              ...ff,
              faculty_name: facultyUser ? facultyUser.full_name : 'Faculty Mentor',
            };
          });

        return {
          ...m,
          submissions,
          feedbacks,
        };
      });

    return res.json({
      success: true,
      project_id: projectId,
      count: milestones.length,
      milestones,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Create Milestone for Project
 * POST /api/projects/:projectId/milestones
 */
const createMilestone = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { title, description, sequence_order, due_date } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description are required.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const newMilestoneId = mockStore.project_milestones.length > 0
      ? Math.max(...mockStore.project_milestones.map(m => m.id)) + 1 : 1;

    const newMilestone = {
      id: newMilestoneId,
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      sequence_order: parseInt(sequence_order, 10) || mockStore.project_milestones.filter(m => m.project_id === projectId).length + 1,
      due_date: due_date ? new Date(due_date) : new Date(Date.now() + 14 * 86400000),
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockStore.project_milestones.push(newMilestone);

    return res.status(201).json({
      success: true,
      message: `Milestone "${newMilestone.title}" created successfully.`,
      milestone: newMilestone,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Student Submits Milestone Progress Text
 * POST /api/milestones/:id/submit
 */
const submitMilestoneProgress = async (req, res) => {
  const milestoneId = parseInt(req.params.id, 10);
  const { submission_text } = req.body;

  if (!submission_text || !submission_text.trim()) {
    return res.status(400).json({ success: false, error: 'Submission text is required.' });
  }

  try {
    const milestoneIndex = mockStore.project_milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    const milestone = mockStore.project_milestones[milestoneIndex];
    const project = mockStore.projects.find(p => p.id === milestone.project_id);

    // Create Submission Record
    const newSubmission = {
      id: mockStore.milestone_submissions.length + 1,
      milestone_id: milestoneId,
      submitted_by_student_id: req.user.id,
      submission_text: submission_text.trim(),
      submitted_at: new Date(),
    };

    mockStore.milestone_submissions.push(newSubmission);

    // Update Milestone Status
    mockStore.project_milestones[milestoneIndex].status = 'SUBMITTED';
    mockStore.project_milestones[milestoneIndex].updated_at = new Date();

    // Send Notification to Faculty Mentor
    if (project && project.assigned_faculty_id) {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: project.assigned_faculty_id,
        title: 'New Milestone Progress Submission',
        message: `Student submitted progress for Milestone: "${milestone.title}" in project "${project.title}".`,
        type: 'FACULTY_FEEDBACK',
        entity_type: 'MILESTONE',
        entity_id: milestoneId,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: `Milestone progress submitted successfully for review.`,
      submission: newSubmission,
      milestone: mockStore.project_milestones[milestoneIndex],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Faculty Evaluates & Provides Feedback on Milestone
 * POST /api/milestones/:id/feedback
 */
const submitFacultyFeedback = async (req, res) => {
  const milestoneId = parseInt(req.params.id, 10);
  const { feedback_text, status_action } = req.body;

  if (!feedback_text || !status_action) {
    return res.status(400).json({
      success: false,
      error: 'Feedback text and status action (APPROVE, REQUEST_IMPROVEMENT, REJECT, COMMENT) are required.',
    });
  }

  const validActions = ['APPROVE', 'REQUEST_IMPROVEMENT', 'REJECT', 'COMMENT'];
  if (!validActions.includes(status_action.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid status action. Must be one of: ${validActions.join(', ')}`,
    });
  }

  try {
    const milestoneIndex = mockStore.project_milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    const milestone = mockStore.project_milestones[milestoneIndex];
    const projectIndex = mockStore.projects.findIndex(p => p.id === milestone.project_id);
    const project = mockStore.projects[projectIndex];

    const actionUpper = status_action.toUpperCase();

    // Insert Faculty Feedback Record
    const newFeedback = {
      id: mockStore.faculty_feedback.length + 1,
      project_id: milestone.project_id,
      milestone_id: milestoneId,
      faculty_id: req.user.id,
      feedback_text: feedback_text.trim(),
      status_action: actionUpper,
      created_at: new Date(),
    };

    mockStore.faculty_feedback.push(newFeedback);

    // Apply Action Decision & Update Milestone Status
    let notificationTitle = 'Faculty Feedback Received';
    let notificationMsg = `Faculty mentor left feedback on Milestone "${milestone.title}".`;

    if (actionUpper === 'APPROVE') {
      mockStore.project_milestones[milestoneIndex].status = 'APPROVED';
      notificationTitle = 'Milestone Approved! 🎉';
      notificationMsg = `Faculty approved Milestone "${milestone.title}"!`;

      // Check if ALL milestones for this project are approved
      const projectMilestones = mockStore.project_milestones.filter(m => m.project_id === milestone.project_id);
      const allApproved = projectMilestones.every(m => m.status === 'APPROVED');
      if (allApproved && projectIndex !== -1) {
        mockStore.projects[projectIndex].status = 'FACULTY_APPROVED';
      }
    } else if (actionUpper === 'REQUEST_IMPROVEMENT') {
      mockStore.project_milestones[milestoneIndex].status = 'REVISION_REQUIRED';
      notificationTitle = 'Improvement Requested on Milestone ⚠️';
      notificationMsg = `Faculty requested improvements for Milestone "${milestone.title}". Comments: "${feedback_text}"`;
      if (projectIndex !== -1) {
        mockStore.projects[projectIndex].status = 'REVISION_REQUESTED';
      }
    } else if (actionUpper === 'REJECT') {
      mockStore.project_milestones[milestoneIndex].status = 'REJECTED';
      notificationTitle = 'Milestone Rejected ❌';
      notificationMsg = `Faculty rejected Milestone "${milestone.title}".`;
    }

    mockStore.project_milestones[milestoneIndex].updated_at = new Date();

    // Send Notification to Project Lead Student
    if (project) {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: project.created_by_student_id,
        title: notificationTitle,
        message: notificationMsg,
        type: actionUpper === 'REQUEST_IMPROVEMENT' ? 'IMPROVEMENT_REQUEST' : 'MILESTONE_APPROVAL',
        entity_type: 'MILESTONE',
        entity_id: milestoneId,
        is_read: false,
        created_at: new Date(),
      });
    }

    return res.json({
      success: true,
      message: `Faculty feedback recorded. Milestone status updated to "${mockStore.project_milestones[milestoneIndex].status}".`,
      milestone: mockStore.project_milestones[milestoneIndex],
      project_status: project ? mockStore.projects[projectIndex]?.status : null,
      feedback: newFeedback,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Faculty Formally Recommends Project for AI Screening
 * POST /api/projects/:projectId/recommend-ai
 */
const recommendForAiScreening = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);

  try {
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = mockStore.projects[projectIndex];

    // Transition project status to RECOMMENDED_FOR_AI_SCREENING
    mockStore.projects[projectIndex].status = 'RECOMMENDED_FOR_AI_SCREENING';
    mockStore.projects[projectIndex].updated_at = new Date();

    // Notify Project Lead Student
    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: project.created_by_student_id,
      title: 'Project Recommended for AI Originality Screening 🚀',
      message: `Faculty mentor formally approved your project "${project.title}" and recommended it for AI Novelty Screening!`,
      type: 'AI_SCREENING_COMPLETED',
      entity_type: 'PROJECT',
      entity_id: projectId,
      is_read: false,
      created_at: new Date(),
    });

    // Notify IP Coordinators
    mockStore.ip_coordinators.forEach(coord => {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: coord.id,
        title: 'New AI Screening Recommendation',
        message: `Faculty recommended project "${project.title}" for AI Originality & Novelty Screening.`,
        type: 'IP_REVIEW_REQUESTED',
        entity_type: 'PROJECT',
        entity_id: projectId,
        is_read: false,
        created_at: new Date(),
      });
    });

    // Audit log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'RECOMMEND_FOR_AI_SCREENING',
      entity: 'PROJECT',
      entity_id: projectId,
      previous_value: { status: project.status },
      new_value: { status: 'RECOMMENDED_FOR_AI_SCREENING' },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `Project "${project.title}" formally recommended for AI Originality Screening.`,
      project: mockStore.projects[projectIndex],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProjectMilestones,
  createMilestone,
  submitMilestoneProgress,
  submitFacultyFeedback,
  recommendForAiScreening,
};
