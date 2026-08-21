import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  FileCheck2,
  Users,
  FileSpreadsheet,
  BarChart3,
  PlusCircle,
  FileUp,
  FileEdit,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTests, setMyTests] = useState([]);
  const [pendingEssays, setPendingEssays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, testsRes, essayRes] = await Promise.all([
          api.get('/analytics/teacher'),
          api.get('/tests'),
          api.get('/essays/teacher/submissions'),
        ]);
        setStats(statsRes.data);
        setMyTests(testsRes.data);
        const pending = essayRes.data.filter((e) => e.status === 'submitted');
        setPendingEssays(pending);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-md">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-[11px] font-medium text-indigo-200">
            <Sparkles className="w-3.5 h-3.5" /> Instructor Dashboard
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-normal">
            Manage your tests, evaluate student essays, upload PDFs to extract questions automatically, and track question difficulty analytics.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link
              to="/teacher/create-test"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create MCQ Test
            </Link>
            <Link
              to="/teacher/pdf-mcq"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" /> PDF → MCQ Extractor
            </Link>
            <Link
              to="/teacher/create-essay"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <FileEdit className="w-3.5 h-3.5" /> Create Essay Prompt
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tests</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalTests || 0}
          </div>
          <div className="text-xs text-slate-500 font-normal">My published & draft tests</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Attempts</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalAttempts || 0}
          </div>
          <div className="text-xs text-slate-500 font-normal">Student test submissions</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Essays</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {pendingEssays.length}
          </div>
          <Link to="/teacher/essays/evaluations" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Evaluate pending essays →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Analytics</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.questionAnalytics?.length || 0} items
          </div>
          <Link to="/teacher/analytics" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            View item difficulty →
          </Link>
        </div>
      </div>

      {/* Pending Essay Evaluation Action Banner */}
      {pendingEssays.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 dark:text-amber-200">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm sm:text-base">
              {pendingEssays.length} Student Essay(s) Waiting For Evaluation
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-normal">
              Students have submitted timed essay responses requiring marks allocation and feedback.
            </p>
          </div>
          <Link
            to="/teacher/essays/evaluations"
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs shrink-0 text-center"
          >
            Grade Submissions Now
          </Link>
        </div>
      )}

      {/* My Created Tests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Created Tests</h2>
          <Link to="/teacher/tests" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
            Manage All Tests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myTests.length === 0 ? (
          <EmptyState
            title="You haven't created any tests yet"
            description="Start by creating an MCQ test manually or extract MCQs from a PDF file."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTests.slice(0, 3).map((test) => (
              <div
                key={test._id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {test.subjectId?.name || 'Subject'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    PUBLISHED
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{test.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-normal">{test.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/80 text-xs text-slate-500 font-normal">
                  <span>Questions: {test.questionCount || 0}</span>
                  <span>Duration: {test.durationMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
