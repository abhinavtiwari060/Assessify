import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { FileCheck2, Trash2, Eye } from 'lucide-react';

const ManageTests = () => {
  const { addToast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests');
      setTests(res.data);
    } catch (err) {
      console.error('Failed to load admin tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Admin Moderation: Permanently delete test "${title}"?`)) return;
    try {
      await api.delete(`/tests/${id}`);
      addToast('Test deleted by Admin', 'success');
      fetchTests();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete test', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Global Test Moderation
        </h1>
        <p className="text-sm text-[var(--text-sub)] mt-1">
          Review, moderate, and remove tests across all teachers.
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : tests.length === 0 ? (
        <EmptyState title="No platform tests found" description="No tests have been published yet." />
      ) : (
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-sub)] text-xs uppercase text-[var(--text-muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Teacher / Creator</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tests.map((test) => (
                  <tr key={test._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                      {test.title}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[var(--text-sub)]">
                      {test.teacherId?.name || 'Teacher'} ({test.teacherId?.email})
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30">
                        {test.subjectId?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold uppercase text-xs text-[var(--text-main)]">
                      {test.type}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(test._id, test.title)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer"
                      >
                        Delete / Moderate
                      </button>
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

export default ManageTests;
