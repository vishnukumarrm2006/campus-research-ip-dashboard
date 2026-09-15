const { mockStore } = require('../config/db');

/**
 * Controller: Get Institutional High-Level KPI Summary Metrics
 * GET /api/analytics/summary
 */
const getSummaryMetrics = async (req, res) => {
  try {
    const totalProjects = mockStore.projects.length;
    const totalStudents = mockStore.students.length;
    const totalFaculty = mockStore.faculty.length;
    const totalDocuments = mockStore.project_documents.length;

    // Faculty mentor utilization calculation
    const assignedFacultyIds = new Set(mockStore.projects.map(p => p.assigned_faculty_id).filter(Boolean));
    const facultyUtilizationRate = totalFaculty > 0 
      ? parseFloat(((assignedFacultyIds.size / totalFaculty) * 100).toFixed(1)) : 0;

    // AI Screening Novelty Distribution
    const aiReports = mockStore.ai_screening_reports;
    const noveltyDistribution = {
      HIGH_NOVELTY_POTENTIAL: aiReports.filter(r => r.recommendation === 'HIGH_NOVELTY_POTENTIAL').length,
      MODERATE_NOVELTY: aiReports.filter(r => r.recommendation === 'MODERATE_NOVELTY').length,
      HIGH_SIMILARITY_RISK: aiReports.filter(r => r.recommendation === 'HIGH_SIMILARITY_RISK').length,
    };

    // Filing status metrics & Conversion Rate
    const filedOrGranted = mockStore.projects.filter(p => 
      ['PATENT_FILED', 'PATENT_PUBLISHED', 'EXAMINATION_REQUESTED', 'PATENT_GRANTED'].includes(p.status)
    ).length;

    const conversionRate = totalProjects > 0 
      ? parseFloat(((filedOrGranted / totalProjects) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      metrics: {
        total_projects: totalProjects,
        total_student_inventors: totalStudents,
        total_faculty_mentors: totalFaculty,
        faculty_utilization_rate_pct: facultyUtilizationRate,
        total_documents_classified: totalDocuments,
        patent_filing_conversion_rate_pct: conversionRate,
        patents_filed_or_granted_count: filedOrGranted,
        ai_screening_novelty_distribution: noveltyDistribution,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch summary analytics: ' + error.message });
  }
};

/**
 * Controller: Get Domain-wise Project Distribution & Workload Metrics
 * GET /api/analytics/domains
 */
const getDomainAnalytics = async (req, res) => {
  try {
    const domainMetrics = mockStore.domains.map(domain => {
      const domainProjects = mockStore.projects.filter(p => p.domain_id === domain.id);
      const facultyAssigned = mockStore.faculty_domains.filter(fd => fd.domain_id === domain.id).length;

      const stageCounts = {
        SUBMITTED: domainProjects.filter(p => p.status === 'SUBMITTED' || p.status === 'NOT_EVALUATED').length,
        RECOMMENDED: domainProjects.filter(p => p.status === 'RECOMMENDED_FOR_IP_REVIEW' || p.status === 'AI_SCREENED').length,
        EVALUATION: domainProjects.filter(p => p.status === 'UNDER_IP_EVALUATION' || p.status === 'PATENT_DRAFTING_IN_PROGRESS').length,
        FILED_GRANTED: domainProjects.filter(p => ['PATENT_FILED', 'PATENT_PUBLISHED', 'EXAMINATION_REQUESTED', 'PATENT_GRANTED'].includes(p.status)).length,
      };

      return {
        id: domain.id,
        name: domain.name,
        description: domain.description,
        is_active: domain.is_active,
        project_count: domainProjects.length,
        faculty_count: facultyAssigned,
        stage_counts: stageCounts,
      };
    });

    return res.json({
      success: true,
      count: domainMetrics.length,
      domains: domainMetrics,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch domain analytics: ' + error.message });
  }
};

/**
 * Controller: Get Stage-by-Stage Patent Filing Conversion Funnel
 * GET /api/analytics/filing-conversion
 */
const getFilingConversionFunnel = async (req, res) => {
  try {
    const STAGES = [
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

    const totalProjects = mockStore.projects.length;

    const funnel = STAGES.map((stageKey, idx) => {
      const count = mockStore.projects.filter(p => p.status === stageKey).length;
      const pct = totalProjects > 0 ? parseFloat(((count / totalProjects) * 100).toFixed(1)) : 0;
      return {
        step: idx + 1,
        stage: stageKey,
        label: stageKey.replace(/_/g, ' '),
        count,
        percentage_of_total: pct,
      };
    });

    return res.json({
      success: true,
      total_projects: totalProjects,
      funnel,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Export Executive Research & IP Performance Report (CSV or JSON)
 * GET /api/analytics/export
 */
const exportExecutiveReport = async (req, res) => {
  const format = (req.query.format || 'csv').toLowerCase();

  try {
    const projectsData = mockStore.projects.map(p => {
      const domain = mockStore.domains.find(d => d.id === p.domain_id);
      const student = mockStore.users.find(u => u.id === p.created_by_student_id);
      const faculty = mockStore.users.find(u => u.id === p.assigned_faculty_id);
      const aiReport = mockStore.ai_screening_reports.find(r => r.project_id === p.id);
      const ipReview = mockStore.ip_reviews.find(r => r.project_id === p.id);

      return {
        project_id: p.id,
        title: p.title,
        domain_name: domain ? domain.name : 'Unknown',
        student_name: student ? student.full_name : 'Unknown',
        faculty_name: faculty ? faculty.full_name : 'Unassigned',
        status: p.status,
        similarity_score: aiReport ? `${aiReport.similarity_score}%` : 'N/A',
        recommendation: aiReport ? aiReport.recommendation : 'N/A',
        docket_number: ipReview ? ipReview.docket_number || 'N/A' : 'N/A',
        application_number: ipReview ? ipReview.application_number || 'N/A' : 'N/A',
        created_at: new Date(p.created_at).toISOString().split('T')[0],
      };
    });

    if (format === 'json') {
      return res.json({
        success: true,
        export_date: new Date().toISOString(),
        total_records: projectsData.length,
        data: projectsData,
      });
    }

    // CSV format generation
    const headers = ['Project ID', 'Title', 'Domain', 'Student Lead', 'Faculty Mentor', 'Filing Status', 'AI Similarity Score', 'AI Recommendation', 'Docket No', 'App No', 'Submission Date'];
    const rows = projectsData.map(d => [
      d.project_id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.domain_name}"`,
      `"${d.student_name}"`,
      `"${d.faculty_name}"`,
      d.status,
      d.similarity_score,
      d.recommendation,
      d.docket_number,
      d.application_number,
      d.created_at,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Campus_IP_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Report export failed: ' + error.message });
  }
};

module.exports = {
  getSummaryMetrics,
  getDomainAnalytics,
  getFilingConversionFunnel,
  exportExecutiveReport,
};
