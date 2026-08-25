import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  Search,
  Clock,
  BookOpen,
  PlayCircle,
  Award,
  Layers,
  KeyRound,
  CheckCircle,
  Lock,
  FileText,
} from 'lucide-react';

const AvailableTests = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Test Code Modal State
  const [activeTestForCode, setActiveTestForCode] = useState(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, subRes] = await Promise.all([
          api.get('/tests'),
          api.get('/subjects'),
        ]);
        setTests(testsRes.data || []);
        setSubjects(subRes.data || []);
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesSubject = !selectedSubject || (t.subjectId && t.subjectId._id === selectedSubject);
    const matchesType = !selectedType || t.type === selectedType;
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesType && matchesSearch;
  });

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-[var(--text-main)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Available Assessment Tests
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
          Select a teacher-started test and enter your unique 4-character test code to begin.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search tests by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          >
            <option value="">All Test Types</option>
            <option value="mcq">MCQ Tests</option>
            <option value="essay">Essay Tests</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : filteredTests.length === 0 ? (
        <EmptyState
          title="No tests match your filter"
          description="Try resetting the subject or search term to see more tests."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const status = test.status || 'DRAFT';
            const isCompleted = Boolean(test.hasAttempted) || (test.userAttempts > 0 && test.userAttempts >= (test.maxAttempts || 1));

            let statusText = '';

            if (isCompleted) {
              statusText = 'You have already attempted this test.';
            } else if (status === 'DRAFT') {
              statusText = 'Waiting for teacher to start the test.';
            } else if (status === 'ENDED') {
              statusText = 'This test has ended.';
            } else if (status === 'STARTED') {
              statusText = 'Enter the 4-character test code to begin.';
            }

            return (
              <div
                key={test._id}
                className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-xs hover:border-[#F59E0B]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md text-xs font-bold bg-[var(--bg-sub)] text-[#F59E0B] border border-[var(--border)]">
                      {test.subjectId?.name || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)]">
                        {test.type.toUpperCase()}
                      </span>

                      {/* Status Badges */}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                          COMPLETED
                        </span>
                      ) : status === 'DRAFT' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          NOT STARTED
                        </span>
                      ) : status === 'STARTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 animate-pulse">
                          STARTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                          ENDED
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] line-clamp-2 mt-1">
                      {test.description || 'Proctored online assessment.'}
                    </p>
                  </div>

                  {/* Contextual Status Message Banner */}
                  <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    isCompleted
                      ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                      : status === 'DRAFT'
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                      : status === 'ENDED'
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                      : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-[#22C55E]" />
                    ) : status === 'DRAFT' ? (
                      <Clock className="w-4 h-4 shrink-0" />
                    ) : status === 'ENDED' ? (
                      <Lock className="w-4 h-4 shrink-0" />
                    ) : (
                      <KeyRound className="w-4 h-4 shrink-0" />
                    )}
                    <span>{statusText}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-sub)] pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#F59E0B]" />
                      <span>{test.timerMode === 'none' ? 'No Timer' : `${test.durationMinutes || 30} mins`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                      <span>{test.type === 'essay' ? '1 Essay Topic' : `${test.questionCount} Questions`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#F59E0B]" />
                      <span>Passing: {test.passingPercentage || 40}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#F59E0B]" />
                      <span>Attempts: {test.userAttempts || 0} / {test.maxAttempts}</span>
                    </div>
                  </div>

                  {test.bestScore && (
                    <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3 flex items-center justify-between text-xs text-[#22C55E] font-bold">
                      <span>Best Score</span>
                      <span>{test.bestScore.score} / {test.bestScore.maxMarks} ({test.bestScore.accuracy || 100}%)</span>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  {isCompleted ? (
                    <Link
                      to="/student/history"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[#22C55E]/40 text-[#22C55E] font-bold text-sm shadow-xs transition-all"
                    >
                      <FileText className="w-4 h-4 text-[#22C55E]" />
                      <span>View Result</span>
                    </Link>
                  ) : status === 'DRAFT' ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed text-sm font-bold"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Not Started Yet</span>
                    </button>
                  ) : status === 'ENDED' ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--bg-sub)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed text-sm font-bold"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Test Has Ended</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCodeModal(test)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold text-sm shadow-xs transition-all cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Test</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0A0A0A] font-bold text-xs shadow-md cursor-pointer"
              >
                {verifying ? 'Verifying...' : 'Verify & Start Test'}
              </button>
            </>
          }
        >
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-6 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg-sub)] text-[#F59E0B] flex items-center justify-center border border-[var(--border)]">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-[var(--text-main)]">
                {activeTestForCode.title}
              </h4>
              <p className="text-xs text-[var(--text-sub)] mt-1">
                Enter the 4-character code provided by your teacher to unlock this test.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
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

export default AvailableTests;

