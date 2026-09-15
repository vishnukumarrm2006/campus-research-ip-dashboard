import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'sec1', key: 'title_field', label: '1. Title & Technical Field of Invention', icon: '📝' },
  { id: 'sec2', key: 'technical_problem', label: '2. Technical Background & Problem Solved', icon: '❓' },
  { id: 'sec3', key: 'detailed_description', label: '3. Detailed Description & Implementation', icon: '⚙️' },
  { id: 'sec4', key: 'novelty_inventive_step', label: '4. Novel Features & Inventive Step (Non-Obviousness)', icon: '💡' },
  { id: 'sec5', key: 'commercial_utility', label: '5. Commercial & Industrial Applicability', icon: '📈' },
  { id: 'sec6', key: 'prior_art_differences', label: '6. Prior-Art Comparison & Patent Differences', icon: '🌐' },
  { id: 'sec7', key: 'inventor_splits', label: '7. Co-Inventor Revenue Sharing % Split Allocation', icon: '🤝' },
];

const InventionDisclosureEditor = ({ projectId, token, userRole }) => {
  const [disclosure, setDisclosure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [activeSection, setActiveSection] = useState('sec1');
  const [formData, setFormData] = useState({
    title_field: '',
    technical_problem: '',
    detailed_description: '',
    novelty_inventive_step: '',
    commercial_utility: '',
    prior_art_differences: '',
    inventor_splits: [],
  });

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedDossier, setExportedDossier] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDisclosure();
  }, [projectId]);

  const fetchDisclosure = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/disclosures/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.disclosure) {
        setDisclosure(data.disclosure);
        setFormData({
          title_field: data.disclosure.title_field || '',
          technical_problem: data.disclosure.technical_problem || '',
          detailed_description: data.disclosure.detailed_description || '',
          novelty_inventive_step: data.disclosure.novelty_inventive_step || '',
          commercial_utility: data.disclosure.commercial_utility || '',
          prior_art_differences: data.disclosure.prior_art_differences || '',
          inventor_splits: data.disclosure.inventor_splits || [],
        });
      } else {
        setError(data.error || 'Failed to load disclosure form.');
      }
    } catch (err) {
      setError('Connection error while loading disclosure form.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSplitChange = (index, newPercentage) => {
    const updated = [...formData.inventor_splits];
    updated[index].percentage = parseFloat(newPercentage) || 0;
    setFormData(prev => ({ ...prev, inventor_splits: updated }));
  };

  const calculateTotalSplit = () => {
    return formData.inventor_splits.reduce((acc, cur) => acc + (parseFloat(cur.percentage) || 0), 0);
  };

  const handleSaveDisclosure = async (e) => {
    if (e) e.preventDefault();

    const totalPct = calculateTotalSplit();
    if (formData.inventor_splits.length > 0 && Math.abs(totalPct - 100) > 0.1) {
      alert(`Co-inventor revenue sharing percentage splits must equal exactly 100%. Current sum: ${totalPct}%`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/disclosures/project/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setDisclosure(data.disclosure);
        setSuccessMessage(data.message);
      } else {
        setError(data.error || 'Failed to save disclosure form.');
      }
    } catch (err) {
      setError('Connection error while saving disclosure form.');
    } finally {
      setSaving(false);
    }
  };

  const handleImportPriorArtCitations = async () => {
    try {
      const res = await fetch(`/api/prior-art/saved/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.citations && data.citations.length > 0) {
        const citationSummary = data.citations.map((c, i) => 
          `${i + 1}. ${c.citation_title} (${c.source_platform}, ${c.document_id}) - Match Score: ${c.similarity_score}%\n   Relevance Notes: ${c.relevance_notes}`
        ).join('\n\n');

        const currentText = formData.prior_art_differences ? `${formData.prior_art_differences}\n\n` : '';
        handleFieldChange('prior_art_differences', `${currentText}--- IMPORTED BOOKMARKED PRIOR-ART CITATIONS ---\n${citationSummary}`);
        alert(`Successfully imported ${data.citations.length} bookmarked prior-art citations into Section 6!`);
      } else {
        alert('No bookmarked prior-art citations found for this project. Use the Prior-Art Search tool to bookmark references first.');
      }
    } catch (err) {
      alert('Failed to import prior-art citations: ' + err.message);
    }
  };

  const handleExportDossier = async () => {
    setExporting(true);
    setExportedDossier(null);
    setShowExportModal(true);

    try {
      const res = await fetch(`/api/disclosures/project/${projectId}/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setExportedDossier(data);
      } else {
        setError(data.error || 'Failed to export disclosure dossier.');
      }
    } catch (err) {
      setError('Connection error while exporting dossier.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyDossier = () => {
    if (exportedDossier?.dossier_markdown) {
      navigator.clipboard.writeText(exportedDossier.dossier_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Invention Disclosure Form editor...</div>;
  }

  const totalSplit = calculateTotalSplit();
  const isSplitValid = Math.abs(totalSplit - 100) < 0.1;

  return (
    <div className="space-y-6">
      {/* Editor Header Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">
            <span>📄 Official Invention Disclosure Form (IDF)</span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">Draft v{disclosure?.version || 1}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Structured Collaborative Disclosure Editor</h2>
          <p className="text-slate-400 text-xs mt-1">
            Co-author the 7 mandatory sections of the campus Invention Disclosure Form before submission to the IP Office.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportDossier}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>📥 Export IDF Dossier</span>
          </button>

          <button
            onClick={handleSaveDisclosure}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            {saving ? 'Saving Draft...' : '💾 Save Disclosure Draft'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl flex justify-between items-center">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* 7-Section Accordion / Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Section Navigation Accordion Sidebar */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-2 mb-2">IDF Sections</span>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition flex items-center justify-between border ${
                activeSection === sec.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>{sec.icon}</span>
                <span className="truncate">{sec.label.split('.')[1]}</span>
              </div>
              <span className="text-[10px] opacity-75">{sec.label.split('.')[0]}</span>
            </button>
          ))}
        </div>

        {/* Active Section Content Form (Span 3) */}
        <div className="md:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">

          {/* Section 1: Title & Field */}
          {activeSection === 'sec1' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📝 Section 1: Title & Technical Field of Invention</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specify the formal concise title of the invention and its broader engineering/research domain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Invention Title</label>
                <textarea
                  rows={2}
                  value={formData.title_field}
                  onChange={(e) => handleFieldChange('title_field', e.target.value)}
                  placeholder="e.g. Smart Agricultural Soil Micro-Nutrient Monitoring System..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Section 2: Technical Background & Problem Solved */}
          {activeSection === 'sec2' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>❓ Section 2: Technical Background & Problem Solved</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Describe existing technical drawbacks, inefficiencies, or unsolved challenges in current state-of-the-art solutions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Technical Problem Statement</label>
                <textarea
                  rows={6}
                  value={formData.technical_problem}
                  onChange={(e) => handleFieldChange('technical_problem', e.target.value)}
                  placeholder="Detail the technical drawbacks of prior methods, lab delays, costs, or accuracy limits..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Section 3: Detailed Description */}
          {activeSection === 'sec3' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚙️ Section 3: Detailed Description & Implementation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Comprehensive technical breakdown of how the invention operates, components, circuits, software algorithms, and hardware schematics.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Detailed Invention Specifications</label>
                <textarea
                  rows={8}
                  value={formData.detailed_description}
                  onChange={(e) => handleFieldChange('detailed_description', e.target.value)}
                  placeholder="Describe hardware schematics, optical wavelength choices, micro-controller firmware execution, or model architectures..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Section 4: Novel Features */}
          {activeSection === 'sec4' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>💡 Section 4: Novel Features & Inventive Step (Non-Obviousness)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Identify specific patentable elements that distinguish this invention from obvious combinations of known prior art.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Novel Claims & Inventive Aspects</label>
                <textarea
                  rows={6}
                  value={formData.novelty_inventive_step}
                  onChange={(e) => handleFieldChange('novelty_inventive_step', e.target.value)}
                  placeholder="1. Direct-insertion optical spectrographic sensor probe operating without wet chemical lab reagents..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Section 5: Commercial Utility */}
          {activeSection === 'sec5' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📈 Section 5: Commercial & Industrial Applicability</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Detail target commercial industries, market licensing prospects, cost benefits, and industrial scale production feasibility.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Commercial Value & Target Markets</label>
                <textarea
                  rows={5}
                  value={formData.commercial_utility}
                  onChange={(e) => handleFieldChange('commercial_utility', e.target.value)}
                  placeholder="Target market: Commercial farms, precision agriculture equipment OEMs, extension services..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Section 6: Prior Art Differences */}
          {activeSection === 'sec6' && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🌐 Section 6: Prior-Art Comparison & Patent Differences</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Explain technical distinctions over closest published literature and patents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImportPriorArtCitations}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <span>📥 Import Bookmarked Citations</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Differences Over Existing Patents & Papers</label>
                <textarea
                  rows={8}
                  value={formData.prior_art_differences}
                  onChange={(e) => handleFieldChange('prior_art_differences', e.target.value)}
                  placeholder="Detail how your invention differs from specific cited patents or IEEE papers..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-purple-500 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Section 7: Co-Inventor Splits */}
          {activeSection === 'sec7' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🤝 Section 7: Co-Inventor Revenue Sharing % Split Allocation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Define the official percentage allocation for future patent commercialization royalties among student lead, co-inventors, and faculty advisors (Must equal exactly 100%).
                </p>
              </div>

              {/* Validation Badge */}
              <div className={`p-3 rounded-xl border flex justify-between items-center ${
                isSplitValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className="text-xs font-semibold">
                  {isSplitValid ? '✅ Total Royalty Split equals 100%' : `⚠️ Total Split must equal 100%. Current total: ${totalSplit}%`}
                </span>
                <span className="text-sm font-bold">{totalSplit}% / 100%</span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                {formData.inventor_splits.map((s, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <span className="font-semibold text-white text-sm">{s.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({s.role})</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={s.percentage}
                        onChange={(e) => handleSplitChange(idx, e.target.value)}
                        className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-purple-300 focus:border-purple-500 text-center"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === activeSection);
                if (idx > 0) setActiveSection(SECTIONS[idx - 1].id);
              }}
              disabled={activeSection === 'sec1'}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-40"
            >
              ← Previous Section
            </button>

            <button
              type="button"
              onClick={handleSaveDisclosure}
              disabled={saving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === activeSection);
                if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
              }}
              disabled={activeSection === 'sec7'}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-40"
            >
              Next Section →
            </button>
          </div>

        </div>
      </div>

      {/* Export Markdown Dossier Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📥 Export Formal Invention Disclosure Form Dossier</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {exporting ? (
                <div className="p-12 text-center text-slate-400">Compiling structured disclosure dossier for export...</div>
              ) : exportedDossier ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-400 font-mono font-semibold">{exportedDossier.filename}</span>
                    <button
                      onClick={handleCopyDossier}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>{copied ? '✅ Copied to Clipboard!' : '📋 Copy Markdown Dossier'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {exportedDossier.dossier_markdown}
                  </pre>
                </>
              ) : (
                <div className="text-rose-400 text-sm">Failed to generate export dossier.</div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventionDisclosureEditor;
