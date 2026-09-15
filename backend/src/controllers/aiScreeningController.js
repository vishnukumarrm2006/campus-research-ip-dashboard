const { query, mockStore } = require('../config/db');
const aiScreeningService = require('../services/aiScreeningService');

/**
 * Controller: Trigger AI-Assisted Originality & Novelty Screening
 * POST /api/projects/:projectId/ai-screening
 */
const triggerAiScreening = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const projectIndex = mockStore.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = mockStore.projects[projectIndex];
    const domain = mockStore.domains.find(d => d.id === project.domain_id);

    // Call AI Screening Service Abstraction
    const aiAnalysis = await aiScreeningService.analyzeProject({
      ...project,
      domain_name: domain ? domain.name : 'Research Domain',
    });

    // Check if report already exists for project
    let reportIndex = mockStore.ai_screening_reports.findIndex(r => r.project_id === projectId);
    let reportId = null;

    if (reportIndex !== -1) {
      reportId = mockStore.ai_screening_reports[reportIndex].id;
      mockStore.ai_screening_reports[reportIndex] = {
        ...mockStore.ai_screening_reports[reportIndex],
        ...aiAnalysis,
        project_id: projectId,
        updated_at: new Date(),
      };
    } else {
      reportId = mockStore.ai_screening_reports.length > 0
        ? Math.max(...mockStore.ai_screening_reports.map(r => r.id)) + 1 : 1;

      const newReport = {
        id: reportId,
        project_id: projectId,
        ...aiAnalysis,
        created_at: new Date(),
      };

      mockStore.ai_screening_reports.push(newReport);
    }

    // Replace Similarity Results Matches
    mockStore.similarity_results = mockStore.similarity_results.filter(sr => sr.ai_report_id !== reportId);
    aiAnalysis.matched_sources.forEach(src => {
      mockStore.similarity_results.push({
        id: mockStore.similarity_results.length + 1,
        ai_report_id: reportId,
        matched_source_title: src.matched_source_title,
        matched_source_url: src.matched_source_url,
        similarity_percentage: parseFloat(src.similarity_percentage),
        matched_segment_description: src.matched_segment_description,
        created_at: new Date(),
      });
    });

    // Update Project Status to AI_SCREENED
    mockStore.projects[projectIndex].status = 'AI_SCREENED';
    mockStore.projects[projectIndex].updated_at = new Date();

    // Send Event Notifications
    mockStore.notifications.push({
      id: mockStore.notifications.length + 1,
      user_id: project.created_by_student_id,
      title: 'AI Originality Screening Complete 🤖',
      message: `AI Screening Report ready for "${project.title}". Similarity Score: ${aiAnalysis.similarity_score}%. Recommendation: ${aiAnalysis.recommendation}.`,
      type: 'AI_SCREENING_COMPLETED',
      entity_type: 'AI_REPORT',
      entity_id: reportId,
      is_read: false,
      created_at: new Date(),
    });

    if (project.assigned_faculty_id) {
      mockStore.notifications.push({
        id: mockStore.notifications.length + 1,
        user_id: project.assigned_faculty_id,
        title: 'AI Screening Report Ready',
        message: `AI Originality Screening complete for student project "${project.title}".`,
        type: 'AI_SCREENING_COMPLETED',
        entity_type: 'AI_REPORT',
        entity_id: reportId,
        is_read: false,
        created_at: new Date(),
      });
    }

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'TRIGGER_AI_SCREENING',
      entity: 'AI_REPORT',
      entity_id: reportId,
      previous_value: null,
      new_value: { similarity_score: aiAnalysis.similarity_score, recommendation: aiAnalysis.recommendation },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'AI Originality & Novelty Screening analysis completed successfully.',
      report: {
        id: reportId,
        project_id: projectId,
        ...aiAnalysis,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'AI Screening failed: ' + error.message });
  }
};

/**
 * Controller: Get AI Report for a Project
 * GET /api/projects/:projectId/ai-screening
 */
const getAiReport = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const report = mockStore.ai_screening_reports.find(r => r.project_id === projectId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'No AI screening report generated for this project yet.' });
    }

    const matches = mockStore.similarity_results.filter(sr => sr.ai_report_id === report.id);

    return res.json({
      success: true,
      report: {
        ...report,
        matched_sources: matches,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  triggerAiScreening,
  getAiReport,
};
