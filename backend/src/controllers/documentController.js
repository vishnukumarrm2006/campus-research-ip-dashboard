const path = require('path');
const fs = require('fs');
const { query, mockStore } = require('../config/db');

const ALLOWED_DOCUMENT_TYPES = [
  'PROPOSAL',
  'LITERATURE_SURVEY',
  'DESIGN_DOCUMENT',
  'PROGRESS_REPORT',
  'FINAL_REPORT',
  'SUPPORTING_DOCUMENT',
  'INVENTION_DISCLOSURE',
];

/**
 * Controller: Get All Documents for a Project
 * GET /api/projects/:projectId/documents
 */
const getProjectDocuments = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Role Access Control Check
    const user = req.user;
    let hasAccess = false;
    if (user.role_name === 'ADMIN' || user.role_name === 'IP_COORDINATOR') {
      hasAccess = true;
    } else if (user.role_name === 'FACULTY' && project.assigned_faculty_id === user.id) {
      hasAccess = true;
    } else if (user.role_name === 'STUDENT') {
      const isMember = mockStore.project_members.some(pm => pm.project_id === projectId && pm.student_id === user.id);
      if (isMember || project.created_by_student_id === user.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have authorization to view documents for this project.',
      });
    }

    const documents = mockStore.project_documents
      .filter(d => d.project_id === projectId)
      .map(d => {
        const uploader = mockStore.users.find(u => u.id === d.uploaded_by_user_id);
        return {
          ...d,
          uploaded_by_name: uploader ? uploader.full_name : 'System User',
        };
      });

    return res.json({
      success: true,
      project_id: projectId,
      count: documents.length,
      documents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Upload / Register Classified Project Document
 * POST /api/projects/:projectId/documents
 */
const uploadDocument = async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { document_type, file_name, file_size, mime_type } = req.body;

  if (!document_type || !file_name) {
    return res.status(400).json({
      success: false,
      error: 'Please provide document_type and file_name.',
    });
  }

  const docTypeUpper = document_type.toUpperCase();
  if (!ALLOWED_DOCUMENT_TYPES.includes(docTypeUpper)) {
    return res.status(400).json({
      success: false,
      error: `Invalid document_type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
    });
  }

  try {
    const project = mockStore.projects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    // Role Access Control Check
    const user = req.user;
    let canUpload = false;
    if (user.role_name === 'ADMIN') {
      canUpload = true;
    } else if (user.role_name === 'STUDENT') {
      const isMember = mockStore.project_members.some(pm => pm.project_id === projectId && pm.student_id === user.id);
      if (isMember || project.created_by_student_id === user.id) {
        canUpload = true;
      }
    } else if (user.role_name === 'FACULTY' && project.assigned_faculty_id === user.id) {
      canUpload = true;
    }

    if (!canUpload) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have upload permissions for this project.',
      });
    }

    const newDocId = mockStore.project_documents.length > 0
      ? Math.max(...mockStore.project_documents.map(d => d.id)) + 1 : 1;

    const safeFileName = file_name.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFilePath = `/uploads/projects/${projectId}/${safeFileName}`;

    const newDocument = {
      id: newDocId,
      project_id: projectId,
      uploaded_by_user_id: user.id,
      document_type: docTypeUpper,
      file_name: safeFileName,
      file_path: targetFilePath,
      file_size: parseInt(file_size, 10) || 1024000,
      mime_type: mime_type || 'application/pdf',
      uploaded_at: new Date(),
    };

    mockStore.project_documents.push(newDocument);

    // Audit log
    mockStore.audit_logs.push({
      id: mockStore.audit_logs.length + 1,
      user_id: user.id,
      role_name: user.role_name,
      action: 'UPLOAD_DOCUMENT',
      entity: 'DOCUMENT',
      entity_id: newDocId,
      previous_value: null,
      new_value: newDocument,
      ip_address: req.ip || '127.0.0.1',
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Document "${safeFileName}" classified as ${docTypeUpper} uploaded successfully.`,
      document: {
        ...newDocument,
        uploaded_by_name: user.full_name,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Secure Document Download / Inspection
 * GET /api/documents/:id/download
 */
const downloadDocument = async (req, res) => {
  const documentId = parseInt(req.params.id, 10);

  try {
    const document = mockStore.project_documents.find(d => d.id === documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const project = mockStore.projects.find(p => p.id === document.project_id);

    // Access Control Check
    const user = req.user;
    let hasAccess = false;
    if (user.role_name === 'ADMIN' || user.role_name === 'IP_COORDINATOR') {
      hasAccess = true;
    } else if (user.role_name === 'FACULTY' && project && project.assigned_faculty_id === user.id) {
      hasAccess = true;
    } else if (user.role_name === 'STUDENT' && project) {
      const isMember = mockStore.project_members.some(pm => pm.project_id === project.id && pm.student_id === user.id);
      if (isMember || project.created_by_student_id === user.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have permission to download this project document.',
      });
    }

    const uploader = mockStore.users.find(u => u.id === document.uploaded_by_user_id);

    return res.json({
      success: true,
      message: 'Secure document download authorized.',
      document: {
        ...document,
        uploaded_by_name: uploader ? uploader.full_name : 'System User',
        download_url: `/api/documents/${document.id}/stream`,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Controller: Delete Document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res) => {
  const documentId = parseInt(req.params.id, 10);

  try {
    const docIndex = mockStore.project_documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const document = mockStore.project_documents[docIndex];

    // Authorization Check: Uploader or Admin only
    if (document.uploaded_by_user_id !== req.user.id && req.user.role_name !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only the uploader or Admin can delete this document.' });
    }

    const removed = mockStore.project_documents.splice(docIndex, 1)[0];

    return res.json({
      success: true,
      message: `Document "${removed.file_name}" deleted successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProjectDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  ALLOWED_DOCUMENT_TYPES,
};
