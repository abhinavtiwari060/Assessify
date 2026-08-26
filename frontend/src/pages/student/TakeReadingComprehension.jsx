import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import AntiCheatingTracker from '../../components/AntiCheatingTracker';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  RotateCcw,
  Send,
  HelpCircle,
  Maximize2,
  X,
} from 'lucide-react';

const TakeReadingComprehension = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mobile passage drawer state
  const [passageDrawerOpen, setPassageDrawerOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch test & initialize attempt
  useEffect(() => {
    const initTestSession = async () => {
      try {
        const testRes = await api.get(`/tests/${testId}`);
        const testData = testRes.data;
        setTest(testData);

        const qList = testData.questions || [];
        setQuestions(qList);

        const attemptRes = await api.post(`/attempts/start`, { testId });
        const attemptData = attemptRes.data;
        setAttempt(attemptData);

        // Pre-fill answers from saved attempt
        const initialAnswers = qList.map((q) => {
          const savedAns = (attemptData.answers || []).find(
            (a) => String(a.questionId) === String(q._id)
          );
          return {
            questionId: q._id,
            selectedOptionIndex:
              savedAns && savedAns.selectedOptionIndex !== undefined
                ? savedAns.selectedOptionIndex
                : null,
            isFlagged: savedAns ? Boolean(savedAns.isFlagged) : false,
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to start test session:', err);
        addToast(err.response?.data?.message || 'Failed to start test session', 'error');
        navigate('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };
    initTestSession();
  }, [testId]);

  // Current question & answer
  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer =
    answers.find((a) => a.questionId === currentQuestion?._id) || {
      selectedOptionIndex: null,
      isFlagged: false,
    };

  // Find passage text for current question
  const currentPassageText = currentQuestion?.passageId
    ? questions.find((q) => q.passageId === currentQuestion.passageId && q.passage)?.passage ||
      currentQuestion.passage
    : currentQuestion?.passage;

  // Answer selection handler
  const handleOptionSelect = (optionIdx) => {
    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id ? { ...a, selectedOptionIndex: optionIdx } : a
    );
    setAnswers(updatedAnswers);
    saveProgress(updatedAnswers);
  };

  const handleToggleFlag = () => {
    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id ? { ...a, isFlagged: !a.isFlagged } : a
    );
    setAnswers(updatedAnswers);
    saveProgress(updatedAnswers);
  };

  const handleClearChoice = () => {
    const updatedAnswers = answers.map((a) =>
      a.questionId === currentQuestion._id ? { ...a, selectedOptionIndex: null } : a
    );
    setAnswers(updatedAnswers);
    saveProgress(updatedAnswers);
  };

  // Auto-save progress to backend
  const saveProgress = async (updatedAnswers) => {
    if (!attempt?._id) return;
    try {
      await api.put(`/attempts/${attempt._id}/save-progress`, {
        answers: updatedAnswers,
      });
    } catch (err) {
      console.warn('Auto-save progress failed:', err.message);
    }
  };

  // Submit test
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attempt._id}/submit`, {
        answers,
        isAutoSubmit,
      });
      addToast(isAutoSubmit ? 'Time up! Test submitted automatically.' : 'Test submitted successfully!', 'success');
      navigate(`/student/attempt/${attempt._id}/result`);
    } catch (err) {
      console.error('Failed to submit test:', err);
      addToast('Failed to submit test. Retrying...', 'error');
      setSubmitting(false);
    }
  };

  if (loading) return <CardSkeleton />;

  const answeredCount = answers.filter(
    (a) => a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[var(--text-main)]">
      {/* Anti-Cheating Bar */}
      <AntiCheatingTracker attemptId={attempt?._id} onAutoSubmit={() => handleFinalSubmit(true)} />

      {/* Header bar with timer and controls */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center font-black">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FA8128]">
              Reading Comprehension Module • {test?.subjectId?.name || 'English'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] leading-tight">
              {test?.title}
            </h2>
          </div>
        </div>

        {/* Timer */}
        {test?.timerMode === 'full' && (
          <Timer
            initialSeconds={(test.durationMinutes || 30) * 60}
            onTimeUp={() => handleFinalSubmit(true)}
            label="Reading Comprehension Time Left"
          />
        )}

        {/* Mobile View Passage Drawer Toggle Button */}
        <button
          onClick={() => setPassageDrawerOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 text-xs font-extrabold cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>View Passage</span>
        </button>
      </div>

      {/* Main Split Layout Grid (Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Passage Panel (6 cols on Desktop) */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border-2 border-[#FA8128]/40 shadow-xs space-y-4 flex flex-col max-h-[680px] sticky top-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FA8128]" />
                <h3 className="font-extrabold text-sm text-[var(--text-main)]">
                  Reading Passage
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)]">
                Scroll to read full text
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm font-serif leading-relaxed text-[var(--text-main)] whitespace-pre-wrap bg-[var(--bg-sub)] p-5 rounded-xl border border-[var(--border)] select-text">
              {currentPassageText || 'Reading passage text...'}
            </div>
          </div>
        </div>

        {/* Right Column: Question Panel (6 cols on Desktop) */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6 flex flex-col justify-between min-h-[580px]">
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[var(--text-muted)]">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30">
                    Comprehension Q
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
              <div className="text-base sm:text-lg font-black text-[var(--text-main)] leading-relaxed">
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
                        <span className="font-semibold text-xs sm:text-sm leading-snug">
                          {option}
                        </span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#FA8128] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nav Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-6">
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
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Palette */}
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
            isSequential={test?.isSequential}
          />
        </div>
      </div>

      {/* Mobile Floating Passage Drawer Modal */}
      {passageDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl p-6 border border-[var(--border)] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#FA8128]" />
                <h3 className="font-extrabold text-base text-[var(--text-main)]">
                  Reading Passage
                </h3>
              </div>
              <button
                onClick={() => setPassageDrawerOpen(false)}
                className="p-1.5 text-[var(--text-sub)] hover:bg-[var(--bg-sub)] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm font-serif leading-relaxed text-[var(--text-main)] whitespace-pre-wrap bg-[var(--bg-sub)] p-4 rounded-xl border border-[var(--border)]">
              {currentPassageText || 'Reading passage text...'}
            </div>

            <button
              onClick={() => setPassageDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#FA8128] text-white font-extrabold text-xs cursor-pointer"
            >
              Back to Questions
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {confirmModalOpen && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title="Submit Reading Comprehension Test?"
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-sub)]">
              You have answered <strong className="text-[#FA8128]">{answeredCount}</strong> out of{' '}
              <strong>{questions.length}</strong> questions. Are you sure you want to submit?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--text-main)] cursor-pointer"
              >
                Continue Test
              </button>

              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="px-6 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-xs cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TakeReadingComprehension;
