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
  CheckCircle,
  Clock,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner - Solid Dark Developer Surface */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262D] border border-[#30363D] text-xs font-bold text-[#58A6FF]">
          <Sparkles className="w-3.5 h-3.5" /> Instructor Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F0F6FC] tracking-tight">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
          Manage your tests, evaluate student essays, extract MCQs from PDFs, and view real-time difficulty analytics.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/teacher/create-test"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] font-bold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create MCQ Test
          </Link>
          <Link
            to="/teacher/pdf-mcq"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#F0F6FC] border border-[#30363D] font-bold text-xs transition-colors"
          >
            <FileUp className="w-4 h-4 text-[#58A6FF]" /> PDF → MCQ Extractor
          </Link>
          <Link
            to="/teacher/create-essay"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-[#F0F6FC] border border-[#30363D] font-bold text-xs transition-colors"
          >
            <FileEdit className="w-4 h-4 text-[#D29922]" /> Create Essay Prompt
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Total Tests</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#58A6FF]">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {stats?.totalTests || 0}
          </div>
          <div className="text-xs text-[#8B949E]">Published & draft tests</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Total Attempts</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#3FB950]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {stats?.totalAttempts || 0}
          </div>
          <div className="text-xs text-[#8B949E]">Student test submissions</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Pending Essays</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#D29922]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {stats?.pendingEssays || 0}
          </div>
          <div className="text-xs text-[#8B949E]">Essays awaiting evaluation</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Analytics</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#58A6FF]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            Item Analysis
          </div>
          <Link to="/teacher/analytics" className="text-xs font-semibold text-[#58A6FF] hover:underline flex items-center gap-1">
            Question Analytics →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/teacher/tests"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#21262D] border border-[#30363D] text-[#58A6FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#F0F6FC] text-base">Manage Tests</h3>
            <p className="text-xs text-[#8B949E] font-normal">View, edit, and control test status</p>
          </div>
        </Link>

        <Link
          to="/teacher/reports"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#21262D] border border-[#30363D] text-[#3FB950] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#F0F6FC] text-base">Student Reports</h3>
            <p className="text-xs text-[#8B949E] font-normal">Export Excel reports & scores</p>
          </div>
        </Link>

        <Link
          to="/teacher/essays/evaluations"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#21262D] border border-[#30363D] text-[#D29922] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileEdit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#F0F6FC] text-base">Essay Grading</h3>
            <p className="text-xs text-[#8B949E] font-normal">Grade essays & export DOCX</p>
          </div>
        </Link>
      </div>

      {/* Recent Tests Table */}
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#F0F6FC]">
            Recent Assessment Tests
          </h2>
          <Link to="/teacher/tests" className="text-xs font-bold text-[#58A6FF] hover:underline flex items-center gap-1">
            View All Tests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTests.length === 0 ? (
          <p className="text-xs text-[#8B949E] py-4 text-center">No tests created yet. Click "Create MCQ Test" to start!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTests.map((t) => (
              <div key={t._id} className="bg-[#21262D] rounded-xl p-4 border border-[#30363D] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#58A6FF] uppercase">{t.subjectId?.name || 'General'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    t.status === 'STARTED'
                      ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/30'
                      : t.status === 'ENDED'
                      ? 'bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/30'
                      : 'bg-[#D29922]/20 text-[#D29922] border border-[#D29922]/30'
                  }`}>
                    {t.status || 'DRAFT'}
                  </span>
                </div>
                <h4 className="font-bold text-[#F0F6FC] text-sm truncate">{t.title}</h4>
                <div className="text-[11px] text-[#8B949E] flex items-center justify-between pt-1">
                  <span>Code: <strong className="font-mono text-[#F0F6FC]">{t.testCode}</strong></span>
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
