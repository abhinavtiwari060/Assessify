import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  PlusCircle,
  Edit,
  Trash2,
  Play,
  Square,
  FileUp,
  KeyRound,
  FileText,
  BookOpen,
} from 'lucide-react';

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const { addToast } = useToast();

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests');
      setTests(res.data);
    } catch (err) {
      console.error('Failed to load my tests:', err);
      addToast('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartTest = async (id, title) => {
    setActionLoadingId(id);
    try {
      await api.post(`/tests/${id}/start-session`);
      addToast(`Test "${title}" has been STARTED. Students can now enter using the test code.`, 'success');
      fetchTests();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to start test', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEndTest = async (id, title) => {
    if (!window.confirm(`Are you sure you want to END test "${title}"?\n\nEnding the test will immediately AUTO-SUBMIT all currently active student attempts!`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await api.post(`/tests/${id}/end-session`);
      addToast(`Test "${title}" has been ENDED. Auto-submitted ${res.data.autoSubmittedMcqCount || 0} MCQ attempts and ${res.data.autoSubmittedEssayCount || 0} Essay attempts.`, 'info');
      fetchTests();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to end test', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete test "${title}"?`)) return;

    try {
      await api.delete(`/tests/${id}`);
      addToast('Test deleted successfully', 'success');
      setTests((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[var(--text-main)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            My Tests Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Manage test lifecycles (Start / End), unique test codes, and student access controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/teacher/create-test"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Create MCQ Test</span>
          </Link>
          <Link
            to="/teacher/create-reading-comprehension"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FA8128]/15 hover:bg-[#FA8128]/25 border border-[#FA8128]/40 text-[#FA8128] font-extrabold text-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#FA8128]" />
            <span>Create Reading Comp</span>
          </Link>
          <Link
            to="/teacher/create-essay"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-main)] font-bold text-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#FA8128]" />
            <span>Create Essay Test</span>
          </Link>
          <Link
            to="/teacher/pdf-mcq"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-main)] font-bold text-xs transition-colors"
          >
            <FileUp className="w-4 h-4 text-[#FA8128]" />
            <span>PDF → MCQ</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {[
          { key: 'all', label: 'All Content' },
          { key: 'mcq', label: 'MCQ Tests' },
          { key: 'reading_comprehension', label: 'Reading Comprehension' },
          { key: 'essay', label: 'Essay Prompts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              filterType === tab.key
                ? 'bg-[#FA8128] text-white shadow-xs'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--bg-sub)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton />
      ) : tests.length === 0 ? (
        <EmptyState
          title="No tests created yet"
          description="Create your first MCQ, Reading Comprehension, or Essay test to begin evaluating students."
        />
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--bg-sub)] text-[11px] uppercase text-[var(--text-muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3.5">Test Name</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Test Code</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tests
                  .filter((t) => {
                    if (filterType === 'all') return true;
                    const tType = t.testType || t.type || 'mcq';
                    return tType === filterType;
                  })
                  .map((test) => {
                  const status = test.status || 'DRAFT';
                  const displayType = test.testType || test.type || 'mcq';
                  return (
                    <tr key={test._id} className="hover:bg-[var(--bg-sub)] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[var(--text-main)]">
                          {test.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                          Subject: {test.subjectId?.name || 'General'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold uppercase text-xs">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-[var(--bg-sub)] text-[#FA8128] border border-[var(--border)]">
                          {displayType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-sub)] border border-[var(--border)] rounded-lg font-mono text-xs font-black text-[#FA8128]">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{test.testCode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {status === 'DRAFT' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30">
                            NOT STARTED
                          </span>
                        )}
                        {status === 'STARTED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 animate-pulse">
                            STARTED
                          </span>
                        )}
                        {status === 'ENDED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            ENDED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-[var(--text-muted)]">
                        {new Date(test.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Lifecycle Start/End Controls */}
                          {status === 'DRAFT' && (
                            <button
                              onClick={() => handleStartTest(test._id, test.title)}
                              disabled={actionLoadingId === test._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-white" />
                              <span>{actionLoadingId === test._id ? 'Starting...' : 'Start Test'}</span>
                            </button>
                          )}

                          {status === 'STARTED' && (
                            <button
                              onClick={() => handleEndTest(test._id, test.title)}
                              disabled={actionLoadingId === test._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5 fill-current text-white" />
                              <span>{actionLoadingId === test._id ? 'Ending...' : 'End Test'}</span>
                            </button>
                          )}

                          {displayType === 'reading_comprehension' ? (
                            <Link
                              to={`/teacher/edit-reading-comprehension/${test._id}`}
                              className="p-1.5 text-[var(--text-sub)] hover:bg-[var(--bg-sub)] rounded-xl transition-colors cursor-pointer"
                              title="Edit Reading Comprehension"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          ) : displayType === 'mcq' ? (
                            <Link
                              to={`/teacher/edit-test/${test._id}`}
                              className="p-1.5 text-[var(--text-sub)] hover:bg-[var(--bg-sub)] rounded-xl transition-colors cursor-pointer"
                              title="Edit Test"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          ) : (
                            <Link
                              to="/teacher/essays/evaluations"
                              className="p-1.5 text-[#FA8128] hover:bg-[var(--bg-sub)] rounded-xl font-bold text-xs flex items-center gap-1"
                              title="View Submissions"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Submissions</span>
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(test._id, test.title)}
                            className="p-1.5 text-[#EF4444] hover:bg-[var(--bg-sub)] rounded-xl cursor-pointer"
                            title="Delete Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTests;

