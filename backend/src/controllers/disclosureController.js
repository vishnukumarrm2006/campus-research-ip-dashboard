const { mockStore } = require('../config/db');

/**
 * Controller: Get Structured Invention Disclosure Form (IDF) Draft
 * GET /api/disclosures/project/:projectId
 */
const getDisclosure = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    let disclosure = mockStore.invention_disclosures.find(d => d.project_id === projectId);

    // Auto-create default draft if not existing
    if (!disclosure) {
      const studentUser = mockStore.users.find(u => u.id === project.created_by_student_id);
      const facultyUser = mockStore.users.find(u => u.id === project.assigned_faculty_id);

      const defaultSplits = [
        { student_id: project.created_by_student_id, name: studentUser ? studentUser.full_name : 'Lead Student', role: 'Lead Student Inventor', percentage: 70 },
      ];
      if (facultyUser) {
        defaultSplits.push({ faculty_id: project.assigned_faculty_id, name: facultyUser.full_name, role: 'Faculty Advisor', percentage: 30 });
      }

      disclosure = {
        id: mockStore.invention_disclosures.length + 1,
        project_id: projectId,
        version: 1,
        title_field: project.title || '',
        technical_problem: project.problem_statement || '',
        detailed_description: project.abstract || '',
        novelty_inventive_step: project.innovation_description || '',
        commercial_utility: 'Under commercial evaluation for licensing and tech transfer.',
        prior_art_differences: 'Demonstrates clear non-obviousness over standard existing solutions in the field.',
        inventor_splits: defaultSplits,
        is_locked: false,
        locked_by_user_id: null,
        locked_at: null,
        updated_at: new Date(),
        created_at: new Date(),
      };

      mockStore.invention_disclosures.push(disclosure);
    }

    return res.json({
      success: true,
      disclosure,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch disclosure: ' + error.message });
  }
};

/**
 * Controller: Update/Save Structured Invention Disclosure Form Sections
 * PUT /api/disclosures/project/:projectId
 */
const saveDisclosure = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  const {
    title_field,
    technical_problem,
    detailed_description,
    novelty_inventive_step,
    commercial_utility,
    prior_art_differences,
    inventor_splits,
  } = req.body;

  try {
    let index = mockStore.invention_disclosures.findIndex(d => d.project_id === projectId);
    let disclosure;

    if (index !== -1) {
      disclosure = mockStore.invention_disclosures[index];

      // Verify inventor splits sum equals 100 if provided
      if (inventor_splits && Array.isArray(inventor_splits)) {
        const totalPct = inventor_splits.reduce((acc, cur) => acc + (parseFloat(cur.percentage) || 0), 0);
        if (Math.abs(totalPct - 100) > 0.1) {
          return res.status(400).json({
            success: false,
            error: `Inventor revenue sharing percentage splits must total 100%. Current sum: ${totalPct}%`,
          });
        }
      }

      mockStore.invention_disclosures[index] = {
        ...disclosure,
        version: disclosure.version + 1,
        title_field: title_field !== undefined ? title_field : disclosure.title_field,
        technical_problem: technical_problem !== undefined ? technical_problem : disclosure.technical_problem,
        detailed_description: detailed_description !== undefined ? detailed_description : disclosure.detailed_description,
        novelty_inventive_step: novelty_inventive_step !== undefined ? novelty_inventive_step : disclosure.novelty_inventive_step,
        commercial_utility: commercial_utility !== undefined ? commercial_utility : disclosure.commercial_utility,
        prior_art_differences: prior_art_differences !== undefined ? prior_art_differences : disclosure.prior_art_differences,
        inventor_splits: inventor_splits || disclosure.inventor_splits,
        updated_at: new Date(),
      };
      disclosure = mockStore.invention_disclosures[index];
    } else {
      disclosure = {
        id: mockStore.invention_disclosures.length + 1,
        project_id: projectId,
        version: 1,
        title_field: title_field || '',
        technical_problem: technical_problem || '',
        detailed_description: detailed_description || '',
        novelty_inventive_step: novelty_inventive_step || '',
        commercial_utility: commercial_utility || '',
        prior_art_differences: prior_art_differences || '',
        inventor_splits: inventor_splits || [],
        is_locked: false,
        locked_by_user_id: null,
        locked_at: null,
        updated_at: new Date(),
        created_at: new Date(),
      };
      mockStore.invention_disclosures.push(disclosure);
    }

    // Audit Log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: req.user.id,
      role_name: req.user.role_name,
      action: 'UPDATE_INVENTION_DISCLOSURE',
      entity: 'INVENTION_DISCLOSURE',
      entity_id: disclosure.id,
      previous_value: null,
      new_value: { version: disclosure.version, updated_at: disclosure.updated_at },
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.json({
      success: true,
      message: `Invention Disclosure Form (v${disclosure.version}) draft saved successfully.`,
      disclosure,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to save disclosure draft: ' + error.message });
  }
};

/**
 * Controller: Export Formal Invention Disclosure Form Dossier
 * POST /api/disclosures/project/:projectId/export
 */
const exportDisclosure = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const disclosure = mockStore.invention_disclosures.find(d => d.project_id === projectId);
    const project = mockStore.projects.find(p => p.id === projectId);

    if (!disclosure || !project) {
      return res.status(404).json({ success: false, error: 'Disclosure form not found for this project.' });
    }

    const savedCitations = mockStore.saved_prior_art_citations.filter(c => c.project_id === projectId);

    // Format compiled Markdown Dossier for Patent Attorney / IP Office
    const dossierMarkdown = `
# FORMAL CAMPUS INVENTION DISCLOSURE DOSSIER (IDF)
**Institutional Reference Docket**: IP-${new Date().getFullYear()}-IDF-${String(projectId).padStart(4, '0')}
**Draft Version**: v${disclosure.version} | **Export Date**: ${new Date().toLocaleDateString()}

---

## 1. TITLE & TECHNICAL FIELD OF INVENTION
**Title**: ${disclosure.title_field}
**Research Domain**: ${project.domain_name || 'Engineering & Technology'}

## 2. TECHNICAL BACKGROUND & PROBLEM SOLVED
${disclosure.technical_problem}

## 3. DETAILED DESCRIPTION OF INVENTION & PREFERRED EMBODIMENT
${disclosure.detailed_description}

## 4. DISTINCT NOVEL FEATURES & INVENTIVE STEP (NON-OBVIOUSNESS)
${disclosure.novelty_inventive_step}

## 5. COMMERCIAL & INDUSTRIAL APPLICABILITY
${disclosure.commercial_utility}

## 6. COMPARISON OVER EXISTING PRIOR-ART & PATENTS
${disclosure.prior_art_differences}

### Attached Bookmarked Prior-Art Literature References (${savedCitations.length}):
${savedCitations.map((c, i) => `${i + 1}. **${c.citation_title}** (${c.source_platform}, ${c.document_id}, ${c.publication_year}) - Similarity Match: ${c.similarity_score}%\n   *Notes*: ${c.relevance_notes}`).join('\n\n') || 'None attached.'}

---

## 7. CO-INVENTOR ROSTER & ROYALTY / REVENUE SHARE ALLOCATION
${disclosure.inventor_splits.map(s => `- **${s.name}** (${s.role}): **${s.percentage}%** Revenue Share`).join('\n')}

---
**INSTITUTIONAL IP CELL ENDORSEMENT**:
Submitted for formal patentability opinion and patent application drafting.
`;

    return res.json({
      success: true,
      filename: `IDF_Dossier_Project_${projectId}_v${disclosure.version}.md`,
      dossier_markdown: dossierMarkdown.trim(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to export disclosure dossier: ' + error.message });
  }
};

module.exports = {
  getDisclosure,
  saveDisclosure,
  exportDisclosure,
};
