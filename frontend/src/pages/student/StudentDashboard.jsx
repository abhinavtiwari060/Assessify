import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  CheckCircle2,
  Target,
  Trophy,
  BarChart2,
  Clock,
  PlayCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, testsRes] = await Promise.all([
          api.get('/analytics/report-card/me'),
          api.get('/tests'),
        ]);
        setReport(reportRes.data);
        setAvailableTests(testsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const summary = report?.summary || {
    totalMcqAttempts: 0,
    averageAccuracy: 0,
    averageScore: 0,
    totalQuestionsAttempted: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-xl p-5 sm:p-6 text-white shadow-md">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-[11px] font-medium text-indigo-200">
            <Sparkles className="w-3.5 h-3.5" /> Student Dashboard
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
            Ready to test your knowledge today? Explore available tests in Java, Python, DBMS, DSA, Aptitude, English, and GK.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tests Completed</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.totalMcqAttempts}
          </div>
          <div className="text-xs text-slate-500 font-normal">MCQ & Essay Submissions</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Accuracy</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <Target className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.averageAccuracy}%
          </div>
          <div className="text-xs text-slate-500 font-normal">Overall correctness rate</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.averageScore} pts
          </div>
          <div className="text-xs text-slate-500 font-normal">Average points per attempt</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Leaderboard</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            Rank Top 5
          </div>
          <Link to="/student/leaderboard" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            View full leaderboard →
          </Link>
        </div>
      </div>

      {/* Available Tests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Available Tests — Ready to Take
          </h2>
          <Link to="/student/available-tests" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            View All Tests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {availableTests.length === 0 ? (
          <EmptyState title="No active tests right now" description="Check back later when teachers publish new tests." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTests.slice(0, 3).map((test) => (
              <div
                key={test._id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 uppercase">
                      {test.subjectId?.name || 'Subject'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      test.type === 'essay' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {test.type.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                    {test.description || 'Test your proficiency and earn leaderboard points.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/80 font-normal">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {test.timerMode === 'none' ? 'Self-Paced' : `${test.durationMinutes || 30} mins`}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {test.type === 'essay' ? '1 Essay' : `${test.questionCount} MCQs`}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    to={test.type === 'essay' ? `/student/test/essay/${test._id}` : `/student/test/mcq/${test._id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Start Test</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-Wise Performance Summary */}
      {report?.subjectBreakdown && report.subjectBreakdown.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Subject-Wise Accuracy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.subjectBreakdown.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">{sub.subjectName}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    sub.status === 'Strong'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {sub.accuracy}%
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.accuracy >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${sub.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
