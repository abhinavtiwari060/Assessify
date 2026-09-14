import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  formatTestDate,
  formatTestTime,
  formatDateForInput,
  formatTimeForInput,
  combineDateAndTime,
} from '../../utils/dateUtils';
import {
  FileCheck2,
  Trash2,
  Edit,
  Calendar,
  Clock,
  PlusCircle,
  BookOpen,
  FileUp,
  FileEdit,
  Save,
} from 'lucide-react';

const ManageTests = () => {
  const { addToast } = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [savingDate, setSavingDate] = useState(false);

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

  const handleOpenReschedule = (test) => {
    setSelectedTest(test);
    const dt = test.testDate || test.startedAt || test.createdAt || new Date();
    setModalDate(formatDateForInput(dt));
    setModalTime(formatTimeForInput(dt));
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    setSavingDate(true);
    try {
      const combinedISO = combineDateAndTime(modalDate, modalTime);
      await api.put(`/tests/${selectedTest._id}`, {
        testDate: combinedISO,
      });

      addToast(`Updated Test Date & Time for "${selectedTest.title}"`, 'success');
      setRescheduleModalOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update test date/time', 'error');
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Creation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            Global Test Moderation & Management
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Review, edit test configurations, change dates & times, and moderate tests across all teachers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/create-test"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Create MCQ</span>
          </Link>
          <Link
            to="/admin/create-reading-comprehension"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FA8128]/15 hover:bg-[#FA8128]/25 border border-[#FA8128]/40 text-[#FA8128] font-extrabold text-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#FA8128]" />
            <span>Create RC</span>
          </Link>
          <Link
            to="/admin/create-essay"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-main)] font-bold text-xs transition-colors"
          >
            <FileEdit className="w-4 h-4 text-[#FA8128]" />
            <span>Create Essay</span>
          </Link>
          <Link
            to="/admin/pdf-mcq"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-main)] font-bold text-xs transition-colors"
          >
            <FileUp className="w-4 h-4 text-[#FA8128]" />
            <span>PDF → MCQ</span>
          </Link>
        </div>
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
                  <th className="px-6 py-4">Test Date & Time</th>
                  <th className="px-6 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {tests.map((test) => {
                  const rawDt = test.testDate || test.startedAt || test.createdAt;
                  const displayType = test.testType || test.type || 'mcq';
                  const editLink =
                    displayType === 'reading_comprehension'
                      ? `/admin/edit-reading-comprehension/${test._id}`
                      : `/admin/edit-test/${test._id}`;

                  return (
                    <tr key={test._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--text-main)]">
                          {test.title}
                        </div>
                        {test.testCode && (
                          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            Code: <span className="font-bold text-[#FA8128]">{test.testCode}</span>
                          </div>
                        )}
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
                        {displayType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--text-main)]">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-semibold text-[var(--text-main)]">
                            <Calendar className="w-3.5 h-3.5 text-[#FA8128]" />
                            {formatTestDate(rawDt)}
                          </span>
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            {formatTestTime(rawDt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReschedule(test)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FA8128]/10 hover:bg-[#FA8128]/20 border border-[#FA8128]/30 text-[#FA8128] font-bold text-xs cursor-pointer transition-colors"
                            title="Reschedule / Set Date & Time"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Set Date/Time</span>
                          </button>
                          <Link
                            to={editLink}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] font-bold text-xs cursor-pointer transition-colors"
                            title="Edit Full Test Configuration"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Test</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(test._id, test.title)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer"
                            title="Permanently Delete Test"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            Delete
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

      {/* Quick Reschedule Date & Time Modal */}
      {rescheduleModalOpen && selectedTest && (
        <Modal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          title={`Set Test Date & Time: ${selectedTest.title}`}
        >
          <form onSubmit={handleSaveReschedule} className="space-y-5 text-[var(--text-main)]">
            <p className="text-xs text-[var(--text-sub)]">
              Configure or change the exact scheduled Date and Time for this test. Past dates and times are fully supported.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FA8128]" />
                  <span>Test Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FA8128]" />
                  <span>Test Time</span>
                </label>
                <input
                  type="time"
                  required
                  value={modalTime}
                  onChange={(e) => setModalTime(e.target.value)}
                  className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
                />
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)] text-xs text-[var(--text-sub)] space-y-1">
              <span className="font-bold text-[var(--text-main)] block">Preview Display for Students:</span>
              <div>
                <strong>Date:</strong> {formatTestDate(combineDateAndTime(modalDate, modalTime))}
              </div>
              <div>
                <strong>Time:</strong> {formatTestTime(combineDateAndTime(modalDate, modalTime))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-xs font-bold text-[var(--text-sub)] hover:bg-[var(--bg-card)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingDate}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingDate ? 'Saving...' : 'Save Date & Time'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManageTests;
