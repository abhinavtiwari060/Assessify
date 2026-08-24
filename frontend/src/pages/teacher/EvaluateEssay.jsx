import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  FileDown,
  KeyRound,
  FileText,
} from 'lucide-react';

const EvaluateEssay = () => {
  const { addToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected submission for modal grading
  const [selectedSub, setSelectedSub] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get('/essays/teacher/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load essay submissions:', err);
      addToast('Failed to load essay submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenEvaluation = (sub) => {
    setSelectedSub(sub);
    setMarks(sub.marksObtained !== null ? sub.marksObtained : '');
    setFeedback(sub.feedback || '');
    setInternalNotes(sub.internalNotes || '');
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSub || marks === '') {
      addToast('Please enter marks obtained', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/essays/submissions/${selectedSub._id}/evaluate`, {
        marksObtained: Number(marks),
        feedback,
        internalNotes,
      });

      addToast('Essay evaluation saved!', 'success');
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Evaluation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDocx = async (sub) => {
    setExportingId(sub._id);
    try {
      addToast('Generating Microsoft Word (.docx) file...', 'info');
      const response = await api.get(`/essays/submissions/${sub._id}/export`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (sub.studentId?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
      const testCode = sub.testId?.testCode || 'TEST';
      
      link.href = url;
      link.setAttribute('download', `Essay-${safeName}-${testCode}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast('Word document downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      addToast('Failed to export Word document', 'error');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Essay Submissions & Evaluation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Read student essay responses, grade marks, provide feedback, and export `.docx` Word documents.
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No essay submissions yet"
          description="Submissions for your essay tests will appear here for grading."
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Test Title</th>
                  <th className="px-6 py-4">Test Code</th>
                  <th className="px-6 py-4">Submission Type</th>
                  <th className="px-6 py-4">Word Count</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Marks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {submissions.map((sub) => {
                  const isAutoSubmitted = sub.submissionType === 'AUTO_SUBMITTED';
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sub.studentId?.name || 'Student'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {sub.studentId?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {sub.testId?.title || 'Essay Test'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <div className="inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          <span>{sub.testId?.testCode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isAutoSubmitted
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isAutoSubmitted ? 'AUTO_SUBMITTED' : 'NORMAL_SUBMISSION'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {sub.wordCount} words
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sub.status === 'evaluated'
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-indigo-500/20 text-indigo-600'
                        }`}>
                          {sub.status === 'evaluated' ? 'EVALUATED' : 'SUBMITTED (PENDING)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {sub.marksObtained !== null ? `${sub.marksObtained} / ${sub.maxMarks}` : `- / ${sub.maxMarks}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Export Word Button */}
                          <button
                            onClick={() => handleExportDocx(sub)}
                            disabled={exportingId === sub._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs shadow-sm transition-all cursor-pointer"
                            title="Export to Word (.docx)"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>{exportingId === sub._id ? 'Exporting...' : 'Export Word'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEvaluation(sub)}
                            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                          >
                            {sub.status === 'evaluated' ? 'Edit Evaluation' : 'Evaluate Essay'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Grading Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Evaluate Essay — ${selectedSub.studentId?.name}`}
          footer={
            <>
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExportDocx(selectedSub)}
                disabled={exportingId === selectedSub._id}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Export Word</span>
              </button>
              <button
                onClick={handleSaveEvaluation}
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Evaluation'}
              </button>
            </>
          }
        >
          <div className="space-y-6">
            {/* Metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs text-slate-500 font-medium border border-slate-200 dark:border-slate-800">
              <span>Test: <strong className="text-slate-900 dark:text-white">{selectedSub.testId?.title}</strong></span>
              <span>Code: <strong className="font-mono text-indigo-600">{selectedSub.testId?.testCode || 'N/A'}</strong></span>
              <span>Submission Type: <strong className={selectedSub.submissionType === 'AUTO_SUBMITTED' ? 'text-amber-600' : 'text-emerald-600'}>{selectedSub.submissionType || 'NORMAL_SUBMISSION'}</strong></span>
              <span>Words: <strong className="text-slate-900 dark:text-white">{selectedSub.wordCount}</strong></span>
            </div>

            {/* Essay Content Panel */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Essay Text</label>
              <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto text-sm text-slate-900 dark:text-white leading-relaxed font-sans whitespace-pre-wrap">
                {selectedSub.essayText || 'No text submitted.'}
              </div>
            </div>

            {/* Evaluation Inputs */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Marks Awarded (Out of {selectedSub.maxMarks})</label>
                <input
                  type="number"
                  min={0}
                  max={selectedSub.maxMarks}
                  required
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Public Feedback for Student</label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback visible to the student..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Internal Evaluation Notes (Teacher Private)</label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private teacher reference notes (not visible to student)..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EvaluateEssay;
