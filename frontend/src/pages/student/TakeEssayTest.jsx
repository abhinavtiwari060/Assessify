import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Timer from '../../components/Timer';
import AntiCheatingTracker from '../../components/AntiCheatingTracker';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import { Save, Send, BookOpen, CheckCircle, ShieldAlert } from 'lucide-react';

const TakeEssayTest = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [test, setTest] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [essayText, setEssayText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const saveTimerRef = useRef(null);

  useEffect(() => {
    const initEssay = async () => {
      try {
        const testRes = await api.get(`/tests/${testId}`);
        setTest(testRes.data);

        if (testRes.data.status === 'DRAFT') {
          addToast('Test has not started yet.', 'warning');
          navigate('/student/available-tests');
          return;
        }
        if (testRes.data.status === 'ENDED') {
          addToast('This test has ended.', 'warning');
          navigate('/student/available-tests');
          return;
        }

        const subRes = await api.post(`/essays/start/${testId}`);
        setSubmission(subRes.data);
        setEssayText(subRes.data.essayText || '');
        setWordCount(subRes.data.wordCount || 0);

        if (subRes.data.status !== 'in_progress') {
          addToast('This essay has already been submitted', 'warning');
          navigate('/student/history');
        }
      } catch (err) {
        console.error('Failed to init essay session:', err);
        addToast(err.response?.data?.message || 'Failed to start essay test', 'error');
        navigate('/student/available-tests');
      } finally {
        setLoading(false);
      }
    };
    initEssay();
  }, [testId, navigate, addToast]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setEssayText(text);
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setWordCount(words);
    setSaveStatus('saving');

    // Debounced autosave
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      if (!submission) return;
      try {
        await api.put(`/essays/submissions/${submission._id}/save`, {
          essayText: text,
          timeSpentSeconds: 30,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Essay autosave failed:', err);
        if (err.response?.data?.message?.includes('ended')) {
          addToast('Teacher has ended the test. Auto-submitting essay...', 'warning');
          handleFinalSubmit();
        } else {
          setSaveStatus('error');
        }
      }
    }, 2000);
  };

  // Anti-Copy/Paste enforcement handlers
  const handleKeyDown = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')
    ) {
      e.preventDefault();
      addToast('Copy, Paste, and Cut are disabled during the test.', 'warning');
    }
  };

  const preventAction = (e, actionName) => {
    e.preventDefault();
    addToast(`${actionName} is disabled in the essay test area.`, 'warning');
  };

  const handleFinalSubmit = async () => {
    if (!submission || submitting) return;
    setSubmitting(true);
    setConfirmModalOpen(false);

    try {
      await api.post(`/essays/submissions/${submission._id}/submit`, {
        essayText,
        timeSpentSeconds: 60,
      });
      addToast('Essay submitted successfully!', 'success');
      navigate('/student/history');
    } catch (err) {
      console.error('Essay submit error:', err);
      addToast(err.response?.data?.message || 'Failed to submit essay', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <AntiCheatingTracker
        attemptId={submission?._id}
        onAutoSubmit={handleFinalSubmit}
      />

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Essay Writing Assessment
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {test?.title}
          </h2>
        </div>

        {test?.durationMinutes && (
          <Timer
            initialSeconds={test.durationMinutes * 60}
            onTimeUp={handleFinalSubmit}
            label="Essay Time Remaining"
          />
        )}
      </div>

      {/* Essay Prompt Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-800 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Essay Prompt & Topic Instructions</span>
        </div>
        <p className="text-lg font-bold leading-relaxed">{test?.description || test?.instructions}</p>
        <div className="text-xs text-indigo-200 bg-indigo-900/60 p-3 rounded-xl border border-indigo-700">
          💡 Instructions: Maintain clean paragraph structure. Your essay will be evaluated by your course instructor based on quality, argument clarity, and technical correctness.
        </div>
      </div>

      {/* Writing Interface Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Word Count: <strong className="text-slate-900 dark:text-white">{wordCount}</strong></span>
            <span>Characters: <strong className="text-slate-900 dark:text-white">{essayText.length}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Save className="w-3.5 h-3.5" />
            <span>
              {saveStatus === 'saving' ? 'Autosaving...' : saveStatus === 'saved' ? 'Autosaved' : 'Save Error'}
            </span>
          </div>
        </div>

        {/* Security Warning Banner */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Copy, Paste, Cut, Right-Click, and Drag-and-Drop are disabled in this essay answer box.</span>
        </div>

        {/* Protected Text Area */}
        <textarea
          rows={15}
          value={essayText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onCopy={(e) => preventAction(e, 'Copying')}
          onPaste={(e) => preventAction(e, 'Pasting')}
          onCut={(e) => preventAction(e, 'Cutting')}
          onContextMenu={(e) => preventAction(e, 'Right-click context menu')}
          onDrop={(e) => preventAction(e, 'Text dragging')}
          placeholder="Begin typing your essay response here..."
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-sans"
        />

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Submit Essay for Grading</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Submit Essay"
        footer={
          <>
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold cursor-pointer"
            >
              Continue Editing
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Yes, Submit Essay'}
            </button>
          </>
        }
      >
        <div className="text-center py-4 space-y-3">
          <CheckCircle className="w-12 h-12 text-purple-500 mx-auto" />
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Ready to submit your essay?</h4>
          <p className="text-xs text-slate-500">Total words written: <strong>{wordCount} words</strong>. Once submitted, your essay will be sent directly to your teacher for grading.</p>
        </div>
      </Modal>
    </div>
  );
};

export default TakeEssayTest;
