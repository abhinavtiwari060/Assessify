import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { addToast } = useToast();

  const initialSubmissionFromState = location.state?.initialSubmission;
  const verifiedCodeFromState = location.state?.verifiedCode;

  const [test, setTest] = useState(null);
  const [submission, setSubmission] = useState(initialSubmissionFromState || null);
  const [essayText, setEssayText] = useState(initialSubmissionFromState?.essayText || '');
  const [wordCount, setWordCount] = useState(initialSubmissionFromState?.wordCount || 0);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [loading, setLoading] = useState(!initialSubmissionFromState);
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

        let subData = initialSubmissionFromState;
        if (!subData) {
          const subRes = await api.post(`/essays/start/${testId}`, {
            code: verifiedCodeFromState || '',
          });
          subData = subRes.data;
        }

        setSubmission(subData);
        setEssayText(subData.essayText || '');
        setWordCount(subData.wordCount || 0);

        if (subData.status !== 'in_progress') {
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
  }, [testId, navigate, addToast, initialSubmissionFromState, verifiedCodeFromState]);

  const handleTextChange = (e) => {
    if (submittingRef.current || submission?.status !== 'in_progress') return;
    const text = e.target.value;
    setEssayText(text);
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setWordCount(words);
    setSaveStatus('saving');

    // Debounced autosave
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      if (!submission || submittingRef.current || submission?.status !== 'in_progress') return;
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

  const submittingRef = useRef(false);

  const handleFinalSubmit = async () => {
    if (!submission || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmModalOpen(false);

    try {
      await api.post(`/essays/submissions/${submission._id}/submit`, {
        essayText,
        timeSpentSeconds: 60,
      });
      addToast('Essay submitted successfully!', 'success');
      navigate('/student/history', { replace: true });
    } catch (err) {
      console.error('Essay submit error:', err);
      const errMsg = err.response?.data?.message || err.message || '';

      if (
        errMsg.includes('already submitted') ||
        errMsg.includes('already been submitted') ||
        err.response?.status === 400
      ) {
        addToast('Redirecting to your submission history...', 'info');
        navigate('/student/history', { replace: true });
        return;
      }

      addToast(errMsg || 'Failed to submit essay', 'error');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-[var(--text-main)]">
      <AntiCheatingTracker
        attemptId={submission?._id}
        attemptType="essay"
        onAutoSubmit={handleFinalSubmit}
        active={!submitting && submission?.status === 'in_progress'}
      />

      {/* Header bar */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FA8128]">
            Essay Writing Assessment
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)] leading-tight">
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

      {/* Essay Prompt Card - Solid Dark Surface */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FA8128] uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-[#FA8128]" />
          <span>Essay Prompt & Topic Instructions</span>
        </div>
        <p className="text-lg font-bold leading-relaxed text-[var(--text-main)]">{test?.description || test?.instructions}</p>
        <div className="text-xs text-[var(--text-sub)] bg-[var(--bg-sub)] p-3 rounded-xl border border-[var(--border)]">
          💡 Instructions: Maintain clean paragraph structure. Your essay will be evaluated by your course instructor based on quality, argument clarity, and technical correctness.
        </div>
      </div>

      {/* Writing Interface Panel */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-sub)]">
            <span>Word Count: <strong className="text-[var(--text-main)]">{wordCount}</strong></span>
            <span>Characters: <strong className="text-[var(--text-main)]">{essayText.length}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Save className="w-3.5 h-3.5" />
            <span>
              {saveStatus === 'saving' ? 'Autosaving...' : saveStatus === 'saved' ? 'Autosaved' : 'Save Error'}
            </span>
          </div>
        </div>

        {/* Security Warning Banner */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#FA8128] bg-[#FA8128]/10 p-3 rounded-xl border border-[#FA8128]/30">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#FA8128]" />
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
          className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-5 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128] leading-relaxed font-sans"
        />

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setConfirmModalOpen(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-base shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-white" />
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-main)] bg-[var(--bg-sub)] cursor-pointer disabled:opacity-50"
            >
              Continue Editing
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Yes, Submit Essay'}
            </button>
          </>
        }
      >
        <div className="text-center py-4 space-y-3">
          <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto" />
          <h4 className="text-lg font-bold text-[var(--text-main)]">Ready to submit your essay?</h4>
          <p className="text-xs text-[var(--text-sub)]">Total words written: <strong>{wordCount} words</strong>. Once submitted, your essay will be sent directly to your teacher for grading.</p>
        </div>
      </Modal>
    </div>
  );
};

export default TakeEssayTest;
