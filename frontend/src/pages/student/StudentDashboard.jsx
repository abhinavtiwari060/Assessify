import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
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
  KeyRound,
  Lock,
  CheckCircle,
  FileText,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Test Code Modal State
  const [activeTestForCode, setActiveTestForCode] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, testsRes] = await Promise.all([
          api.get('/analytics/report-card/me'),
          api.get('/tests'),
        ]);
        setReport(reportRes.data);
        setAvailableTests(testsRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenCodeModal = (test) => {
    setActiveTestForCode(test);
    setEnteredCode('');
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    if (!activeTestForCode) return;

    const trimmed = enteredCode.trim().toUpperCase();
    if (!trimmed) {
      addToast('Please enter the test code.', 'warning');
      return;
    }
    if (trimmed.length !== 4) {
      addToast('Test code must be 4 characters.', 'warning');
      return;
    }

    setVerifying(true);
    try {
      if (activeTestForCode.type === 'essay') {
        const startRes = await api.post(`/essays/start/${activeTestForCode._id}`, {
          code: trimmed,
        });
        addToast('Test code verified! Starting essay session...', 'success');
        const targetTest = activeTestForCode;
        setActiveTestForCode(null);
        navigate(`/student/test/essay/${targetTest._id}`, {
          state: { initialSubmission: startRes.data, verifiedCode: trimmed },
        });
      } else {
        const startRes = await api.post(`/attempts/start/${activeTestForCode._id}`, {
          code: trimmed,
        });
        addToast('Test code verified! Starting MCQ session...', 'success');
        const targetTest = activeTestForCode;
        setActiveTestForCode(null);
        navigate(`/student/test/mcq/${targetTest._id}`, {
          state: { initialAttempt: startRes.data, verifiedCode: trimmed },
        });
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Invalid test code. Please enter the correct test code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

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
    <div className="space-y-6 max-w-7xl mx-auto text-[var(--text-main)]">
      {/* Welcome Banner - ChaiCode Developer Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-sub)] border border-[var(--border)] text-xs font-bold text-[#F59E0B]">
          <Sparkles className="w-3.5 h-3.5" /> Student Developer Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-2xl leading-relaxed">
          Track your real-time performance, complete assigned tests, and improve accuracy across subjects.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tests Completed</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#22C55E]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {summary.totalMcqAttempts}
          </div>
          <div className="text-xs text-[var(--text-sub)]">MCQ & Essay Submissions</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Average Accuracy</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#22C55E]">
              <Target className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {summary.averageAccuracy}%
          </div>
          <div className="text-xs text-[var(--text-sub)]">Overall correctness rate</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Average Score</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#F59E0B]">
              <BarChart2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            {summary.averageScore} <span className="text-xs font-normal text-[var(--text-muted)]">pts</span>
          </div>
          <div className="text-xs text-[var(--text-sub)]">Average points per attempt</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Leaderboard</span>
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#F59E0B]">
              <Trophy className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            Top Rankings
          </div>
          <Link to="/student/leaderboard" className="text-xs font-bold text-[#F59E0B] hover:underline flex items-center gap-1">
            View full leaderboard →
          </Link>
        </div>
      </div>

      {/* Available Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
            Available Tests — Ready to Take
          </h2>
          <Link to="/student/available-tests" className="text-xs font-bold text-[#F59E0B] hover:underline flex items-center gap-1">
            View All Tests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {availableTests.length === 0 ? (
          <EmptyState title="No active tests right now" description="Check back later when teachers publish new tests." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableTests.slice(0, 3).map((test) => {
              const status = test.status || 'DRAFT';
              const isCompleted = Boolean(test.hasAttempted) || (test.userAttempts > 0 && test.userAttempts >= (test.maxAttempts || 1));

              return (
                <div
                  key={test._id}
                  className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs flex flex-col justify-between hover:border-[#F59E0B]/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--bg-sub)] text-[#F59E0B] uppercase border border-[var(--border)]">
                        {test.subjectId?.name || 'Subject'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)]">
                          {test.type}
                        </span>

                        {/* Status Badges */}
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                            COMPLETED
                          </span>
                        ) : status === 'DRAFT' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                            NOT STARTED
                          </span>
                        ) : status === 'STARTED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 animate-pulse">
                            STARTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            ENDED
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[var(--text-main)] line-clamp-1">
                        {test.title}
                      </h3>
                      <p className="text-xs text-[var(--text-sub)] line-clamp-2 mt-1 font-normal leading-relaxed">
                        {test.description || 'Test your proficiency and earn leaderboard points.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--text-sub)] pt-3 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                        {test.timerMode === 'none' ? 'Self-Paced' : `${test.durationMinutes || 30} mins`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#F59E0B]" />
                        {test.type === 'essay' ? '1 Essay' : `${test.questionCount} MCQs`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-5">
                    {isCompleted ? (
                      <Link
                        to="/student/history"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[#22C55E]/40 text-[#22C55E] font-bold text-xs shadow-xs transition-all"
                      >
                        <FileText className="w-4 h-4 text-[#22C55E]" />
                        <span>View Result</span>
                      </Link>
                    ) : status === 'DRAFT' ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed text-xs font-bold"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Not Started Yet</span>
                      </button>
                    ) : status === 'ENDED' ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed text-xs font-bold"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Test Has Ended</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCodeModal(test)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 text-[#0A0A0A]" />
                        <span>Start Test</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject-Wise Performance Summary */}
      {report?.subjectBreakdown && report.subjectBreakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
            Subject-Wise Accuracy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.subjectBreakdown.map((sub, idx) => (
              <div
                key={idx}
                className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-main)]">{sub.subjectName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sub.status === 'Strong'
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                      : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[var(--text-main)]">
                  {sub.accuracy}%
                </div>
                <div className="w-full bg-[var(--bg-sub)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className={`h-full rounded-full ${sub.accuracy >= 75 ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`}
                    style={{ width: `${sub.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Code Entry Modal */}
      {activeTestForCode && (
        <Modal
          isOpen={!!activeTestForCode}
          onClose={() => setActiveTestForCode(null)}
          title="Enter 4-Character Test Code"
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveTestForCode(null)}
                className="px-5 py-2.5 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCodeSubmit}
                disabled={verifying || enteredCode.trim().length !== 4}
                className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0A0A0A] font-bold text-xs shadow-xs cursor-pointer"
              >
                {verifying ? 'Verifying...' : 'Verify & Start Test'}
              </button>
            </>
          }
        >
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-6 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--bg-sub)] text-[#F59E0B] flex items-center justify-center border border-[var(--border)]">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-[var(--text-main)]">
                {activeTestForCode.title}
              </h4>
              <p className="text-xs text-[var(--text-sub)] mt-1">
                Enter the 4-character code provided by your teacher to unlock this test.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Enter Test Code (4 Characters)
              </label>
              <input
                type="text"
                maxLength={4}
                autoFocus
                required
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                placeholder="e.g. A7K2"
                className="w-48 text-center uppercase tracking-widest font-mono text-2xl font-black bg-[var(--bg-sub)] border-2 border-[#F59E0B] rounded-2xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/20"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentDashboard;

