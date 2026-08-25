import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Award,
  HelpCircle,
} from 'lucide-react';

const AttemptResult = () => {
  const { id: attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/attempts/${attemptId}/result`);
        setResult(res.data.attempt);
        setQuestions(res.data.questions || []);

        // Confetti celebration if high accuracy
        if (res.data.attempt && res.data.attempt.accuracy >= 70) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error('Failed to fetch attempt result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return <CardSkeleton />;

  if (!result) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-[var(--text-main)]">Result details not found</h3>
      </div>
    );
  }

  const passingPercentage = result.testId?.passingPercentage || 40;
  const percentage = result.percentage !== undefined ? result.percentage : result.accuracy;
  const isPassed = result.isPassed !== undefined ? result.isPassed : percentage >= passingPercentage;

  const totalQuestions = result.totalQuestions || questions.length;
  const attemptedCount = result.attemptedCount || 0;
  const unansweredCount = result.unansweredCount !== undefined ? result.unansweredCount : Math.max(0, totalQuestions - attemptedCount);

  function formatTime(secs) {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-[var(--text-main)]">
      {/* Top Banner Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-main)] hover:text-[#F59E0B] bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border)] shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          to="/student/history"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#F59E0B] hover:text-[#D97706] bg-[#F59E0B]/10 px-4 py-2 rounded-xl border border-[#F59E0B]/30 transition-colors"
        >
          <Trophy className="w-4 h-4" />
          <span>View All Results</span>
        </Link>
      </div>

      {/* Main Score Card */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[var(--border)]">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-sub)] text-[#F59E0B] border border-[var(--border)]">
              {result.testId?.subjectId?.name || 'Subject Test'}
            </span>
            <h1 className="text-3xl font-extrabold text-[var(--text-main)]">
              {result.testId?.title}
            </h1>
            <p className="text-xs text-[var(--text-sub)]">
              Student: <strong className="text-[var(--text-main)]">{result.studentId?.name}</strong> ({result.studentId?.email})
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Submitted on {new Date(result.submittedAt || result.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-center p-5 bg-[var(--bg-sub)] rounded-2xl border border-[var(--border)] min-w-52 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Final Score</span>
            <div className="text-4xl font-black text-[#F59E0B] my-1">
              {result.score} / {result.maxMarks}
            </div>
            <div className="text-sm font-bold text-[#F59E0B] mb-2">
              {percentage}%
            </div>
            <span className={`text-xs font-bold px-3.5 py-1 rounded-full border ${
              isPassed
                ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
            }`}>
              {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <HelpCircle className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
            <div className="text-xl font-extrabold text-[var(--text-main)]">{totalQuestions}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Qs</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-1">
            <Award className="w-4 h-4 text-[#F59E0B] mx-auto" />
            <div className="text-xl font-extrabold text-[#F59E0B]">{attemptedCount}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Attempted</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] mx-auto" />
            <div className="text-xl font-extrabold text-[#22C55E]">{result.correctCount}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Correct</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-1">
            <XCircle className="w-4 h-4 text-[#EF4444] mx-auto" />
            <div className="text-xl font-extrabold text-[#EF4444]">{result.wrongCount}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Wrong</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <HelpCircle className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
            <div className="text-xl font-extrabold text-[var(--text-muted)]">{unansweredCount}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Unanswered</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-1">
            <Clock className="w-4 h-4 text-[#F59E0B] mx-auto" />
            <div className="text-xl font-extrabold text-[#F59E0B]">{formatTime(result.timeTakenSeconds)}</div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Time Taken</div>
          </div>
        </div>
      </div>

      {/* Question Breakdown Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-[var(--text-main)]">Question-by-Question Review</h3>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const isUnattempted = q.selectedOptionIndex === null || q.selectedOptionIndex === undefined;

            return (
              <div
                key={q._id}
                className={`bg-[var(--bg-card)] rounded-2xl p-6 border transition-all ${
                  isCorrect
                    ? 'border-[#22C55E]/30 bg-[#22C55E]/5'
                    : isUnattempted
                    ? 'border-[var(--border)]'
                    : 'border-[#EF4444]/30 bg-[#EF4444]/5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Q{idx + 1} ({q.marks} marks)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isCorrect
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                      : isUnattempted
                      ? 'bg-[var(--bg-sub)] text-[var(--text-muted)] border-[var(--border)]'
                      : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                  }`}>
                    {isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
                  </span>
                </div>

                <p className="text-base font-bold text-[var(--text-main)] mb-4 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = q.selectedOptionIndex === optIdx;
                    const isRightAnswer = q.correctAnswerIndex === optIdx;

                    let optStyle = 'border-[var(--border)] bg-[var(--bg-sub)] text-[var(--text-main)]';
                    if (isRightAnswer) {
                      optStyle = 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E] font-bold';
                    } else if (isUserChoice && !isRightAnswer) {
                      optStyle = 'border-[#EF4444] bg-[#EF4444]/15 text-[#EF4444] font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border text-sm flex items-center justify-between ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] font-bold text-xs flex items-center justify-center">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isRightAnswer && <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />}
                        {isUserChoice && !isRightAnswer && <XCircle className="w-4 h-4 text-[#EF4444]" />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="bg-[var(--bg-sub)] rounded-xl p-4 text-xs text-[var(--text-sub)] border border-[var(--border)]">
                    <strong className="text-[#F59E0B]">Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttemptResult;
