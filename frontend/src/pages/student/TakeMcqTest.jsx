import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import AntiCheatingTracker from '../../components/AntiCheatingTracker';
import Modal from '../../components/Modal';
import { QuestionSkeleton } from '../../components/LoadingSkeleton';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  RotateCcw,
  Send,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

const TakeMcqTest = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const initialAttemptFromState = location.state?.initialAttempt;
  const verifiedCodeFromState = location.state?.verifiedCode;

  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(initialAttemptFromState || null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAttemptFromState?.answers || []);
  const [loading, setLoading] = useState(!initialAttemptFromState);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Dirty answers tracking ref for batched autosave
  const dirtyQuestionsRef = useRef(new Set());
  const answersRef = useRef([]);
  answersRef.current = answers;

  // Flush dirty answers in batch to backend
  const flushDirtyAnswers = useCallback(async () => {
    if (!attempt || dirtyQuestionsRef.current.size === 0) return;

    const dirtyQIds = Array.from(dirtyQuestionsRef.current);
    dirtyQuestionsRef.current.clear();

    const currentAns = answersRef.current;
    const batchPayload = dirtyQIds
      .map((qId) => {
        const a = currentAns.find((ans) => ans.questionId === qId);
        return {
          questionId: qId,
          selectedOptionIndex: a ? a.selectedOptionIndex : null,
          timeSpentSeconds: 5,
          isFlagged: a ? Boolean(a.isFlagged) : false,
        };
      })
      .filter(Boolean);

    if (batchPayload.length === 0) return;

    try {
      await api.put(`/attempts/${attempt._id}/save-batch`, { answers: batchPayload });
    } catch (err) {
      console.error('Batch autosave error:', err);
      // Re-add failed IDs to dirty set for retry
      dirtyQIds.forEach((qId) => dirtyQuestionsRef.current.add(qId));
    }
  }, [attempt]);

  // Periodic autosave every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      flushDirtyAnswers();
    }, 5000);
    return () => clearInterval(interval);
  }, [flushDirtyAnswers]);

  const initializedTestIdRef = useRef(null);

  // Load Test & Start Attempt (Guarded against duplicate requests)
  useEffect(() => {
    if (initializedTestIdRef.current === testId) return;
    initializedTestIdRef.current = testId;

    const initTest = async () => {
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

        setQuestions(testRes.data.questions || []);

        let attemptData = initialAttemptFromState;
        if (!attemptData) {
          // If no initial attempt passed from state, call start attempt API with code
          const attemptRes = await api.post(`/attempts/start/${testId}`, {
            code: verifiedCodeFromState || '',
          });
          attemptData = attemptRes.data;
        }

        setAttempt(attemptData);
        setAnswers(attemptData.answers || []);
      } catch (err) {
        console.error('Failed to initialize test:', err);
        addToast(err.response?.data?.message || 'Failed to start test', 'error');
        navigate('/student/available-tests');
      } finally {
        setLoading(false);
      }
    };
    initTest();
  }, [testId, navigate, addToast, initialAttemptFromState, verifiedCodeFromState]);

  const currentQuestion = questions[currentIndex];

  // Helper to find answer for current question
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?._id
  ) || { selectedOptionIndex: null, isFlagged: false };

  // Handle Option Select (Local state + mark dirty)
  const handleOptionSelect = (optionIndex) => {
    if (!currentQuestion || !attempt) return;

    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id
        ? { ...a, selectedOptionIndex: optionIndex }
        : a
    );
    setAnswers(updatedAnswers);
    dirtyQuestionsRef.current.add(currentQuestion._id);
  };

  // Clear choice
  const handleClearChoice = () => {
    if (!currentQuestion || !attempt) return;
    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id
        ? { ...a, selectedOptionIndex: null }
        : a
    );
    setAnswers(updatedAnswers);
    dirtyQuestionsRef.current.add(currentQuestion._id);
  };

  // Toggle Flag for review
  const handleToggleFlag = () => {
    if (!currentQuestion || !attempt) return;
    const newFlag = !currentAnswer.isFlagged;
    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id
        ? { ...a, isFlagged: newFlag }
        : a
    );
    setAnswers(updatedAnswers);
    dirtyQuestionsRef.current.add(currentQuestion._id);
  };

  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const submittingRef = useRef(false);

  // Submit test to backend with guaranteed redirect & fallback recovery
  const handleFinalSubmit = useCallback(async (isTimerExpired = false) => {
    if (!attemptRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmModalOpen(false);

    try {
      // Safely flush remaining dirty answers without throwing/blocking submit call
      try {
        await flushDirtyAnswers();
      } catch (flushErr) {
        console.warn('Pre-submit answer flush warning:', flushErr);
      }

      const currentAttempt = attemptRef.current;
      const res = await api.post(`/attempts/${currentAttempt._id}/submit`, { isTimerExpired });
      const targetAttemptId = res.data?.attemptId || res.data?.resultId || currentAttempt._id;

      addToast('Test submitted successfully! Redirecting to report...', 'success');
      navigate(`/student/attempt/${targetAttemptId}/result`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      const errMsg = err.response?.data?.message || err.message || '';

      // Fallback Recovery: Check if the attempt was already saved/submitted on backend
      if (
        errMsg.includes('already submitted') ||
        errMsg.includes('already been submitted') ||
        err.response?.status === 400 ||
        err.response?.status === 409
      ) {
        try {
          const currentAttempt = attemptRef.current;
          if (currentAttempt) {
            const checkRes = await api.get(`/attempts/${currentAttempt._id}/result`);
            if (checkRes.data?.attempt) {
              addToast('Redirecting to your test result report...', 'info');
              navigate(`/student/attempt/${currentAttempt._id}/result`, { replace: true });
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback check failed:', fallbackErr);
        }
      }

      addToast(errMsg || 'Submission failed. Please try again.', 'error');
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [flushDirtyAnswers, navigate, addToast]);

  // Handle Question Timer Expiration (Ref-safe against stale closures)
  const handleQuestionTimerUp = useCallback(() => {
    const cIdx = currentIndexRef.current;
    const totalQ = questionsRef.current.length;
    addToast(`Time expired for Question ${cIdx + 1}.`, 'warning');
    if (cIdx < totalQ - 1) {
      setCurrentIndex(cIdx + 1);
    } else {
      handleFinalSubmit(true);
    }
  }, [addToast, handleFinalSubmit]);

  if (loading) {
    return <QuestionSkeleton />;
  }

  const answeredCount = answers.filter(
    (a) => a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined
  ).length;
  const unansweredCount = questions.length - answeredCount;

  const currentPassageText = currentQuestion?.passageId
    ? questions.find((q) => q.passageId === currentQuestion.passageId && q.passage)?.passage ||
      currentQuestion.passage
    : currentQuestion?.passage;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Anti-Cheating Bar */}
      <AntiCheatingTracker
        attemptId={attempt?._id}
        onAutoSubmit={() => handleFinalSubmit(true)}
      />

      {/* Header bar with timer and controls */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FA8128]">
            {test?.subjectId?.name || 'Subject'}
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)] leading-tight">
            {test?.title}
          </h2>
        </div>

        {/* Timer */}
        {test?.timerMode === 'full' && (
          <Timer
            initialSeconds={(test.durationMinutes || 30) * 60}
            onTimeUp={() => handleFinalSubmit(true)}
            label="Full Test Time Left"
          />
        )}
        {test?.timerMode === 'question' && currentQuestion && (
          <Timer
            key={currentQuestion._id}
            initialSeconds={currentQuestion.timerSeconds || test.perQuestionSeconds || 60}
            onTimeUp={handleQuestionTimerUp}
            label={`Q${currentIndex + 1} Timer`}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Display Panel */}
        <div className="lg:col-span-2 space-y-6">
          {currentPassageText ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Passage Panel */}
              <div className="bg-[var(--bg-card)] rounded-2xl p-5 border-2 border-[#FA8128]/40 shadow-xs space-y-3 flex flex-col max-h-[600px]">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[var(--text-main)]">
                      Reading Passage
                    </h3>
                    <p className="text-[10px] text-[var(--text-sub)]">
                      Read carefully to answer the question
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 text-xs sm:text-sm font-serif leading-relaxed text-[var(--text-main)] whitespace-pre-wrap bg-[var(--bg-sub)] p-4 rounded-xl border border-[var(--border)]">
                  {currentPassageText}
                </div>
              </div>

              {/* Right Column: Question Panel */}
              <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-xs space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[var(--text-muted)]">
                        Question {currentIndex + 1} of {questions.length}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30">
                        Section: Reading Comprehension
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleFlag}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentAnswer.isFlagged
                            ? 'bg-[#FA8128] text-white'
                            : 'bg-[var(--bg-sub)] text-[var(--text-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{currentAnswer.isFlagged ? 'Flagged' : 'Flag'}</span>
                      </button>

                      {currentAnswer.selectedOptionIndex !== null && (
                        <button
                          onClick={handleClearChoice}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-base sm:text-lg font-black text-[var(--text-main)] leading-snug">
                    {currentQuestion?.questionText}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {currentQuestion?.options.map((option, idx) => {
                      const isSelected = currentAnswer.selectedOptionIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'border-[#FA8128] bg-[#FA8128]/10 text-[var(--text-main)] shadow-xs'
                              : 'border-[var(--border)] hover:border-[#FA8128]/50 bg-[var(--bg-sub)] text-[var(--text-sub)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#FA8128] text-white'
                                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] group-hover:bg-[#FA8128]/20'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-semibold text-xs sm:text-sm leading-snug">{option}</span>
                          </div>
                          {isSelected && <CheckCircle className="w-4 h-4 text-[#FA8128] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nav Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-4">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0 || test?.isSequential}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmModalOpen(true)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-xs shadow-xs cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[var(--text-muted)]">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)]">
                    Section: General MCQs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentAnswer.isFlagged
                        ? 'bg-[#FA8128] text-white shadow-xs'
                        : 'bg-[var(--bg-sub)] text-[var(--text-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{currentAnswer.isFlagged ? 'Flagged' : 'Flag for Review'}</span>
                  </button>

                  {currentAnswer.selectedOptionIndex !== null && (
                    <button
                      onClick={handleClearChoice}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Choice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-black text-[var(--text-main)] leading-relaxed">
                {currentQuestion?.questionText}
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = currentAnswer.selectedOptionIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'border-[#FA8128] bg-[#FA8128]/10 text-[var(--text-main)] shadow-xs'
                          : 'border-[var(--border)] hover:border-[#FA8128]/50 bg-[var(--bg-sub)] text-[var(--text-sub)]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-8 h-8 rounded-lg font-extrabold text-sm flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#FA8128] text-white'
                              : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] group-hover:bg-[#FA8128]/20'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-semibold text-sm sm:text-base leading-snug">{option}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[#FA8128] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Nav Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0 || test?.isSequential}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] font-bold text-sm text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-sm shadow-xs cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-sm shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Test</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Palette Panel */}
        <div className="space-y-6">
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
            isSequential={test?.isSequential}
          />

          <button
            onClick={() => setConfirmModalOpen(true)}
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-[#0A0A0A] font-black text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-5 h-5 text-[#0A0A0A]" />
            <span>{submitting ? 'Submitting...' : 'Finish & Submit Test'}</span>
          </button>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Test Submission"
        footer={
          <>
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
            >
              Continue Test
            </button>
            <button
              onClick={() => handleFinalSubmit(false)}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#0A0A0A] font-black text-xs shadow-md cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Yes, Submit Test'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 flex items-center justify-center">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-extrabold text-[var(--text-main)]">
            Are you sure you want to submit your answers?
          </h4>
          <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--bg-sub)] rounded-2xl text-center border border-[var(--border)]">
            <div>
              <div className="text-2xl font-black text-[#22C55E]">{answeredCount}</div>
              <div className="text-xs text-[var(--text-muted)]">Answered</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#EF4444]">{unansweredCount}</div>
              <div className="text-xs text-[var(--text-muted)]">Unanswered</div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-sub)]">Once submitted, your answers will be evaluated.</p>
        </div>
      </Modal>
    </div>
  );
};

export default TakeMcqTest;
