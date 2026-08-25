import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  FileCheck2,
  Users,
  BarChart3,
  PlusCircle,
  FileUp,
  FileEdit,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, reportsRes, essaysRes] = await Promise.all([
          api.get('/tests/my-tests'),
          api.get('/attempts/reports?limit=5'),
          api.get('/essays/teacher/submissions'),
        ]);

        const myTests = testsRes.data || [];
        const reportsData = reportsRes.data?.reports || [];
        const essaySubmissions = essaysRes.data || [];

        const totalAttemptsCount = reportsData.length;
        const pendingEssaysCount = essaySubmissions.filter((e) => e.status === 'submitted').length;

        setStats({
          totalTests: myTests.length,
          totalAttempts: totalAttemptsCount,
          pendingEssays: pendingEssaysCount,
        });

        setRecentTests(myTests.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[var(--text-main)]">
      {/* Welcome Banner - Clean Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-sub)] border border-[var(--border)] text-xs font-bold text-[#FA8128]">
          <Sparkles className="w-3.5 h-3.5 text-[#FA8128]" /> Instructor Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-2xl leading-relaxed">
          Manage your tests, evaluate student essays, extract MCQs from PDFs, and view real-time difficulty analytics.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/teacher/create-test"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-white" /> Create MCQ Test
          </Link>
          <Link
            to="/teacher/pdf-mcq"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border)] font-bold text-xs transition-colors"
          >
            <FileUp className="w-4 h-4 text-[#FA8128]" /> PDF → MCQ Extractor
          </Link>
          <Link
            to="/teacher/create-essay"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border)] font-bold text-xs transition-colors"
          >
            <FileEdit className="w-4 h-4 text-[#FA8128]" /> Create Essay Prompt
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Tests</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#FA8128]">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {stats?.totalTests || 0}
          </div>
          <div className="text-xs text-[var(--text-sub)]">Published & draft tests</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Attempts</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#22C55E]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {stats?.totalAttempts || 0}
          </div>
          <div className="text-xs text-[var(--text-sub)]">Student test submissions</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Pending Essays</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#FA8128]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {stats?.pendingEssays || 0}
          </div>
          <div className="text-xs text-[var(--text-sub)]">Essays awaiting evaluation</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Analytics</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#FA8128]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            Item Analysis
          </div>
          <Link to="/teacher/analytics" className="text-xs font-semibold text-[#FA8128] hover:underline flex items-center gap-1">
            Question Analytics →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/teacher/tests"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[var(--text-main)] text-base">Manage Tests</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">View, edit, and control test status</p>
          </div>
        </Link>

        <Link
          to="/teacher/reports"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#22C55E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[var(--text-main)] text-base">Student Reports</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">Export Excel reports & scores</p>
          </div>
        </Link>

        <Link
          to="/teacher/essays/evaluations"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[var(--text-main)] text-base">Essay Grading</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">Grade essays & export DOCX</p>
          </div>
        </Link>
      </div>

      {/* Recent Tests Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">
            Recent Assessment Tests
          </h2>
          <Link to="/teacher/tests" className="text-xs font-bold text-[#FA8128] hover:underline flex items-center gap-1">
            View All Tests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTests.length === 0 ? (
          <p className="text-xs text-[var(--text-sub)] py-4 text-center">No tests created yet. Click "Create MCQ Test" to start!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTests.map((t) => (
              <div key={t._id} className="bg-[var(--bg-sub)] rounded-xl p-4 border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#FA8128] uppercase">{t.subjectId?.name || 'General'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    t.status === 'STARTED'
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                      : t.status === 'ENDED'
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                      : 'bg-[#FA8128]/15 text-[#FA8128] border-[#FA8128]/30'
                  }`}>
                    {t.status || 'DRAFT'}
                  </span>
                </div>
                <h4 className="font-bold text-[var(--text-main)] text-sm truncate">{t.title}</h4>
                <div className="text-[11px] text-[var(--text-sub)] flex items-center justify-between pt-1">
                  <span>Code: <strong className="font-mono text-[var(--text-main)]">{t.testCode}</strong></span>
                  <span>{t.questionCount} Questions</span>
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
