import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  X,
  FileCode,
  FileSpreadsheet,
  File
} from 'lucide-react';

export default function DocumentManager({ projectId, canUpload = true }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [documentType, setDocumentType] = useState('PROPOSAL');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const documentTypeBadges = {
    PROPOSAL: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    LITERATURE_SURVEY: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    DESIGN_DOCUMENT: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    PROGRESS_REPORT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    FINAL_REPORT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    SUPPORTING_DOCUMENT: 'bg-slate-800 text-slate-300 border-slate-700',
    INVENTION_DISCLOSURE: 'bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold',
  };

  const fetchDocuments = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/projects/${projectId}/documents`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await apiClient.post(`/projects/${projectId}/documents`, {
        document_type: documentType,
        file_name: selectedFile.name,
        file_size: selectedFile.size || 2450000,
        mime_type: selectedFile.type || 'application/pdf',
      });

      setSuccessMsg(res.data.message);
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await apiClient.get(`/documents/${docId}/download`);
      setSuccessMsg(`Secure download authorized for "${fileName}".`);
    } catch (err) {
      setError(err.response?.data?.error || 'Download authorization failed.');
    }
  };

  const handleDelete = async (docId, fileName) => {
    try {
      const res = await apiClient.delete(`/documents/${docId}`);
      setSuccessMsg(res.data.message);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete document.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Form Box */}
      {canUpload && (
        <form onSubmit={handleFileUpload} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-white flex items-center space-x-1.5">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Upload Classified Research Document</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Max 25 MB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Document Classification Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="PROPOSAL">Project Proposal</option>
                <option value="LITERATURE_SURVEY">Literature Survey Paper</option>
                <option value="DESIGN_DOCUMENT">Design & Architecture Spec</option>
                <option value="PROGRESS_REPORT">Progress Report</option>
                <option value="FINAL_REPORT">Final Technical Report</option>
                <option value="SUPPORTING_DOCUMENT">Supporting Code / Dataset</option>
                <option value="INVENTION_DISCLOSURE">Invention Disclosure Form (IP)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Select File (PDF, DOCX, ZIP) *</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading & Registering...' : 'Upload & Encrypt Document'}</span>
          </button>
        </form>
      )}

      {/* Document List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Classified Document Repository ({documents.length})
          </h4>
          <span className="text-[10px] text-indigo-400 font-mono">Role Access Controlled</span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
            No classified documents uploaded for this project yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl glass-card border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${documentTypeBadges[doc.document_type] || 'bg-slate-800 text-slate-300'}`}>
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{formatFileSize(doc.file_size)}</span>
                  </div>

                  <h5 className="font-bold text-white text-xs">{doc.file_name}</h5>
                  <p className="text-[10px] text-slate-400">
                    Uploaded by <strong className="text-slate-300">{doc.uploaded_by_name}</strong> on {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleDownload(doc.id, doc.file_name)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {(doc.uploaded_by_user_id === user.id || user.role_name === 'ADMIN') && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
