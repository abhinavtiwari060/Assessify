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
  Award,
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5" /> Student Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Ready to test your knowledge today? Explore available tests in Java, Python, DBMS, DSA, Aptitude, English, and GK.
          </p>
        </div>
      </div>

      {/* Required Example Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tests Completed</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalMcqAttempts}
          </div>
          <div className="text-xs text-slate-500">MCQ & Essay Submissions</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Accuracy</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.averageAccuracy}%
          </div>
          <div className="text-xs text-slate-500">Overall correctness rate</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.averageScore} pts
          </div>
          <div className="text-xs text-slate-500">Average points per attempt</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leaderboard Position</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Rank Top 5
          </div>
          <Link to="/student/leaderboard" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View full leaderboard →
          </Link>
        </div>
      </div>

      {/* "Continue / Start Test" Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Available Tests — Ready to Take
          </h2>
          <Link to="/student/available-tests" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            View All Tests <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {availableTests.length === 0 ? (
          <EmptyState title="No active tests right now" description="Check back later when teachers publish new tests." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.slice(0, 3).map((test) => (
              <div
                key={test._id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 uppercase">
                      {test.subjectId?.name || 'Subject'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      test.type === 'essay' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {test.type.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {test.description || 'Test your proficiency and earn leaderboard points.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {test.timerMode === 'none' ? 'Self-Paced' : `${test.durationMinutes || 30} mins`}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      {test.type === 'essay' ? '1 Essay' : `${test.questionCount} MCQs`}
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to={test.type === 'essay' ? `/student/test/essay/${test._id}` : `/student/test/mcq/${test._id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
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
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Subject-Wise Accuracy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.subjectBreakdown.map((sub, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{sub.subjectName}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    sub.status === 'Strong'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {sub.accuracy}%
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
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
