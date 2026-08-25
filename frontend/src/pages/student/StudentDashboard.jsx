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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner - Solid Developer Dark Surface */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-sm space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262D] border border-[#30363D] text-xs font-semibold text-[#58A6FF]">
          <Sparkles className="w-3.5 h-3.5" /> Student Workspace
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F0F6FC] tracking-tight">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-xs sm:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
          Track your real-time performance, complete assigned tests, and improve accuracy across subjects.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#58A6FF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Tests Completed</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#3FB950]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {summary.totalMcqAttempts}
          </div>
          <div className="text-xs text-[#8B949E]">MCQ & Essay Submissions</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Average Accuracy</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#3FB950]">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {summary.averageAccuracy}%
          </div>
          <div className="text-xs text-[#8B949E]">Overall correctness rate</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Average Score</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#58A6FF]">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            {summary.averageScore} <span className="text-xs font-normal text-[#8B949E]">pts</span>
          </div>
          <div className="text-xs text-[#8B949E]">Average points per attempt</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Leaderboard</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#D29922]">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            Top Rankings
          </div>
          <Link to="/student/leaderboard" className="text-xs font-semibold text-[#58A6FF] hover:underline flex items-center gap-1">
            View full leaderboard →
          </Link>
        </div>
      </div>

      {/* Available Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#F0F6FC] tracking-tight">
            Available Tests — Ready to Take
          </h2>
          <Link to="/student/available-tests" className="text-xs font-bold text-[#58A6FF] hover:underline flex items-center gap-1">
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
              const isStartDisabled = isCompleted || status === 'DRAFT' || status === 'ENDED';

              return (
                <div
                  key={test._id}
                  className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs flex flex-col justify-between hover:border-[#58A6FF]/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#21262D] text-[#58A6FF] uppercase border border-[#30363D]">
                        {test.subjectId?.name || 'Subject'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                          {test.type}
                        </span>

                        {/* Status Badges */}
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30">
                            COMPLETED
                          </span>
                        ) : status === 'DRAFT' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D29922]/15 text-[#D29922] border border-[#D29922]/30">
                            NOT STARTED
                          </span>
                        ) : status === 'STARTED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30 animate-pulse">
                            STARTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30">
                            ENDED
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#F0F6FC] line-clamp-1">
                        {test.title}
                      </h3>
                      <p className="text-xs text-[#8B949E] line-clamp-2 mt-1 font-normal leading-relaxed">
                        {test.description || 'Test your proficiency and earn leaderboard points.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#8B949E] pt-3 border-t border-[#30363D]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#58A6FF]" />
                        {test.timerMode === 'none' ? 'Self-Paced' : `${test.durationMinutes || 30} mins`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#58A6FF]" />
                        {test.type === 'essay' ? '1 Essay' : `${test.questionCount} MCQs`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleOpenCodeModal(test)}
                      disabled={isStartDisabled}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] disabled:bg-[#21262D] disabled:text-[#8B949E] disabled:border disabled:border-[#30363D] disabled:cursor-not-allowed text-[#0D1117] font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-[#3FB950]" />
                          <span>Test Completed</span>
                        </>
                      ) : status === 'DRAFT' ? (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Not Started Yet</span>
                        </>
                      ) : status === 'ENDED' ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Test Has Ended</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 text-[#0D1117]" />
                          <span>Start Test</span>
                        </>
                      )}
                    </button>
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
          <h2 className="text-xl font-extrabold text-[#F0F6FC] tracking-tight">
            Subject-Wise Accuracy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.subjectBreakdown.map((sub, idx) => (
              <div
                key={idx}
                className="bg-[#161B22] rounded-2xl p-4 border border-[#30363D] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#F0F6FC]">{sub.subjectName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sub.status === 'Strong'
                      ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/30'
                      : 'bg-[#D29922]/20 text-[#D29922] border border-[#D29922]/30'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-[#F0F6FC]">
                  {sub.accuracy}%
                </div>
                <div className="w-full bg-[#21262D] h-2 rounded-full overflow-hidden border border-[#30363D]">
                  <div
                    className={`h-full rounded-full ${sub.accuracy >= 75 ? 'bg-[#3FB950]' : 'bg-[#D29922]'}`}
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
                className="px-5 py-2.5 rounded-xl border border-[#30363D] font-bold text-xs text-[#F0F6FC] bg-[#21262D] hover:bg-[#30363D] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCodeSubmit}
                disabled={verifying || enteredCode.trim().length !== 4}
                className="px-6 py-2.5 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] disabled:opacity-50 text-[#0D1117] font-bold text-xs shadow-md cursor-pointer"
              >
                {verifying ? 'Verifying...' : 'Verify & Start Test'}
              </button>
            </>
          }
        >
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-6 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#21262D] text-[#58A6FF] flex items-center justify-center border border-[#30363D]">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-[#F0F6FC]">
                {activeTestForCode.title}
              </h4>
              <p className="text-xs text-[#8B949E] mt-1">
                Enter the 4-character code provided by your teacher to unlock this test.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8B949E] block">
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
                className="w-48 text-center uppercase tracking-widest font-mono text-2xl font-black bg-[#21262D] border-2 border-[#58A6FF] rounded-2xl px-4 py-3 text-[#F0F6FC] focus:outline-none focus:ring-4 focus:ring-[#58A6FF]/20"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentDashboard;
