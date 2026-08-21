import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  FileCheck2,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileUp,
} from 'lucide-react';

const MyTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
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
            Manage your created MCQ and Essay tests (Teacher Data Isolated).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/teacher/create-test"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Test</span>
          </Link>
          <Link
            to="/teacher/pdf-mcq"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
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
          description="Create your first test manually or extract questions from a PDF paper."
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Timer Mode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {tests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {test.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {test.subjectId?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold uppercase text-xs">
                      {test.type}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {test.timerMode === 'none' ? 'No Timer' : test.timerMode === 'question' ? 'Per Question' : `${test.durationMinutes} mins`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        test.isPublished ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
                      }`}>
                        {test.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/teacher/edit-test/${test._id}`}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(test._id, test.title)}
                          className="p-2 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTests;
