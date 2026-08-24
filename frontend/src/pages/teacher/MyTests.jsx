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
} from 'lucide-react';

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Tests Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage test lifecycles (Start / End), unique test codes, and student access controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/teacher/create-test"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create MCQ Test</span>
          </Link>
          <Link
            to="/teacher/create-essay"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Essay Test</span>
          </Link>
          <Link
            to="/teacher/pdf-mcq"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
          >
            <FileUp className="w-4 h-4" />
            <span>PDF → MCQ</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : tests.length === 0 ? (
        <EmptyState
          title="No tests created yet"
          description="Create your first MCQ or Essay test to begin evaluating students."
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Test Code</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {tests.map((test) => {
                  const status = test.status || 'DRAFT';
                  return (
                    <tr key={test._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {test.title}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Subject: {test.subjectId?.name || 'General'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold uppercase text-xs">
                        <span className={`px-2.5 py-1 rounded-full ${
                          test.type === 'essay'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {test.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{test.testCode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status === 'DRAFT' && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            NOT STARTED
                          </span>
                        )}
                        {status === 'STARTED' && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                            STARTED
                          </span>
                        )}
                        {status === 'ENDED' && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            ENDED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(test.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Lifecycle Start/End Controls */}
                          {status === 'DRAFT' && (
                            <button
                              onClick={() => handleStartTest(test._id, test.title)}
                              disabled={actionLoadingId === test._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{actionLoadingId === test._id ? 'Starting...' : 'Start Test'}</span>
                            </button>
                          )}

                          {status === 'STARTED' && (
                            <button
                              onClick={() => handleEndTest(test._id, test.title)}
                              disabled={actionLoadingId === test._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>{actionLoadingId === test._id ? 'Ending...' : 'End Test'}</span>
                            </button>
                          )}

                          {test.type === 'essay' && (
                            <Link
                              to="/teacher/essays/evaluations"
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl font-bold text-xs flex items-center gap-1"
                              title="View Submissions"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Submissions</span>
                            </Link>
                          )}

                          <Link
                            to={test.type === 'mcq' ? `/teacher/edit-test/${test._id}` : `/teacher/create-essay`}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Edit Test"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(test._id, test.title)}
                            className="p-2 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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
