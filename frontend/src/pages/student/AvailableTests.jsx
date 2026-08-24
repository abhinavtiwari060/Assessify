import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Lock,
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
        setTests(testsRes.data);
        setSubjects(subRes.data);
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
    if (!activeTestForCode || !enteredCode.trim()) {
      addToast('Please enter the 4-character test code', 'warning');
      return;
    }

    if (enteredCode.trim().length !== 4) {
      addToast('Test code must be exactly 4 characters', 'warning');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.post(`/tests/${activeTestForCode._id}/verify-code`, {
        code: enteredCode.trim().toUpperCase(),
      });

      if (res.data.verified) {
        addToast('Test code verified! Starting test session...', 'success');
        const targetRoute =
          activeTestForCode.type === 'essay'
            ? `/student/test/essay/${activeTestForCode._id}`
            : `/student/test/mcq/${activeTestForCode._id}`;
        
        setActiveTestForCode(null);
        navigate(targetRoute, { state: { verifiedCode: enteredCode.trim().toUpperCase() } });
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Invalid test code', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Available Assessment Tests
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select a teacher-started test and enter your unique 4-character test code to begin.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tests by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            const isCompleted = test.hasAttempted || (test.userAttempts > 0 && test.userAttempts >= (test.maxAttempts || 1));
            
            let statusText = '';
            let isStartDisabled = false;

            if (isCompleted) {
              statusText = 'You have already attempted this test.';
              isStartDisabled = true;
            } else if (status === 'DRAFT') {
              statusText = 'Waiting for teacher to start the test.';
              isStartDisabled = true;
            } else if (status === 'ENDED') {
              statusText = 'This test has ended.';
              isStartDisabled = true;
            } else if (status === 'STARTED') {
              statusText = 'Enter the 4-character test code to begin.';
              isStartDisabled = false;
            }

            return (
              <div
                key={test._id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {test.subjectId?.name || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        test.type === 'essay'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {test.type.toUpperCase()}
                      </span>

                      {/* Status Badges */}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          COMPLETED
                        </span>
                      ) : status === 'DRAFT' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          NOT STARTED
                        </span>
                      ) : status === 'STARTED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                          STARTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          ENDED
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {test.description || 'Proctored online assessment.'}
                    </p>
                  </div>

                  {/* Contextual Status Message Banner */}
                  <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                      : status === 'DRAFT'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                      : status === 'ENDED'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : status === 'DRAFT' ? (
                      <Clock className="w-4 h-4 shrink-0" />
                    ) : status === 'ENDED' ? (
                      <Lock className="w-4 h-4 shrink-0" />
                    ) : (
                      <KeyRound className="w-4 h-4 shrink-0" />
                    )}
                    <span>{statusText}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>{test.timerMode === 'none' ? 'No Timer' : `${test.durationMinutes || 30} mins`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>{test.type === 'essay' ? '1 Essay Topic' : `${test.questionCount} Questions`}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>Passing: {test.passingPercentage || 40}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span>Attempts: {test.userAttempts || 0} / {test.maxAttempts}</span>
                    </div>
                  </div>

                  {test.bestScore && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Best Score</span>
                      <span>{test.bestScore.score} / {test.bestScore.maxMarks} ({test.bestScore.accuracy || 100}%)</span>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleOpenCodeModal(test)}
                    disabled={isStartDisabled}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:dark:from-slate-800 disabled:dark:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
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
                        <PlayCircle className="w-4 h-4" />
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
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCodeSubmit}
                disabled={verifying || enteredCode.trim().length !== 4}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md cursor-pointer"
              >
                {verifying ? 'Verifying...' : 'Verify & Start Test'}
              </button>
            </>
          }
        >
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-6 text-center py-2">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeTestForCode.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter the 4-character code provided by your teacher to unlock this test.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
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
                className="w-48 text-center uppercase tracking-widest font-mono text-2xl font-black bg-slate-50 dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AvailableTests;
