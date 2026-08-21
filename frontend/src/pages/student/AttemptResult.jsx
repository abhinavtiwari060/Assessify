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
  ShieldAlert,
  ArrowLeft,
  Award,
  HelpCircle,
  RotateCcw,
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
        <h3 className="text-[lg] font-bold">Result details not found</h3>
      </div>
    );
  }

  const isPassed = result.accuracy >= 40;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/history"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test History</span>
        </Link>
      </div>

      {/* Main Score Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/80">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {result.testId?.subjectId?.name || 'Subject Test'}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {result.testId?.title}
            </h1>
            <p className="text-xs text-slate-500">
              Completed on {new Date(result.submittedAt || result.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-center p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-indigo-950/60 rounded-3xl border border-indigo-100 dark:border-indigo-800/80 min-w-48 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Final Score</span>
            <div className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent my-1">
              {result.score} / {result.maxMarks}
            </div>
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
              isPassed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{result.correctCount}</div>
            <div className="text-xs font-semibold text-slate-500">Correct</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <XCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{result.wrongCount}</div>
            <div className="text-xs font-semibold text-slate-500">Wrong</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <Award className="w-5 h-5 text-blue-500 mx-auto" />
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{result.accuracy}%</div>
            <div className="text-xs font-semibold text-slate-500">Accuracy</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <ShieldAlert className="w-5 h-5 text-amber-500 mx-auto" />
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{result.violationCount || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Violations</div>
          </div>
        </div>
      </div>

      {/* Question Breakdown Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Question-by-Question Review</h3>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const isUnattempted = q.selectedOptionIndex === null || q.selectedOptionIndex === undefined;

            return (
              <div
                key={q._id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border transition-all ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : isUnattempted
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">Q{idx + 1} ({q.marks} marks)</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCorrect
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : isUnattempted
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
                  </span>
                </div>

                <p className="text-base font-bold text-slate-900 dark:text-white mb-4 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = q.selectedOptionIndex === optIdx;
                    const isRightAnswer = q.correctAnswerIndex === optIdx;

                    let optStyle = 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                    if (isRightAnswer) {
                      optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200';
                    } else if (isUserChoice && !isRightAnswer) {
                      optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-2xl border text-sm flex items-center justify-between ${optStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold text-xs flex items-center justify-center">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isRightAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {isUserChoice && !isRightAnswer && <XCircle className="w-4 h-4 text-rose-500" />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">Explanation: </strong>
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
