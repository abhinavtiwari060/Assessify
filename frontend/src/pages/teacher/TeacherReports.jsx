import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Award,
  BookOpen,
} from 'lucide-react';

const TeacherReports = () => {
  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Available tests for filter dropdown
  const [tests, setTests] = useState([]);

  // Detailed Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [detailAttempt, setDetailAttempt] = useState(null);
  const [detailQuestions, setDetailQuestions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch tests list for dropdown
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/tests');
        setTests(res.data || []);
      } catch (err) {
        console.error('Failed to load tests list:', err);
      }
    };
    fetchTests();
  }, []);

  // Fetch reports list
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedTestId) params.append('testId', selectedTestId);
      if (status && status !== 'all') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/attempts/reports?${params.toString()}`);
      setReports(res.data.reports || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      const msg = err.response?.data?.message || 'Failed to load student reports';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTestId, status, startDate, endDate, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle Excel Export
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedTestId) params.append('testId', selectedTestId);
      if (status && status !== 'all') params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/attempts/reports/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `student-test-reports-${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast('Excel report downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Failed to export Excel report', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Open detailed result modal
  const handleViewDetails = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await api.get(`/attempts/${attemptId}/result`);
      setDetailAttempt(res.data.attempt);
      setDetailQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Failed to fetch result detail:', err);
      addToast('Failed to load attempt details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedTestId('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Test Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track student performance, scores, evaluation accuracy, and export results to Excel.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting || reports.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exporting ? 'Exporting Excel...' : 'Export Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or test..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Test Filter */}
          <div>
            <select
              value={selectedTestId}
              onChange={(e) => {
                setSelectedTestId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Tests</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Needs Improvement</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* End Date & Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {(search || selectedTestId || status !== 'all' || startDate || endDate) && (
              <button
                onClick={handleClearFilters}
                title="Clear Filters"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <TableSkeleton />
      ) : fetchError ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{fetchError}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Loading Reports</span>
          </button>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Student Reports Found"
          description="No student test submissions match your currently selected filter criteria."
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Test Name</th>
                  <th className="px-3 py-3.5 text-center">Total Qs</th>
                  <th className="px-3 py-3.5 text-center">Attempted</th>
                  <th className="px-3 py-3.5 text-center text-emerald-600 dark:text-emerald-400">Correct</th>
                  <th className="px-3 py-3.5 text-center text-rose-500">Wrong</th>
                  <th className="px-3 py-3.5 text-center text-slate-400">Unanswered</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Percentage</th>
                  <th className="px-3 py-3.5">Time Taken</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Submitted At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 font-medium">
                {reports.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Student Name */}
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.studentName}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {r.studentEmail}
                    </td>

                    {/* Test Name */}
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {r.testName}
                    </td>

                    {/* Total Qs */}
                    <td className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                      {r.totalQuestions}
                    </td>

                    {/* Attempted */}
                    <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300">
                      {r.attempted}
                    </td>

                    {/* Correct */}
                    <td className="px-3 py-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                      {r.correct}
                    </td>

                    {/* Wrong */}
                    <td className="px-3 py-3 text-center font-bold text-rose-500">
                      {r.wrong}
                    </td>

                    {/* Unanswered */}
                    <td className="px-3 py-3 text-center text-slate-400">
                      {r.unanswered}
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {r.score} / {r.maxMarks}
                    </td>

                    {/* Percentage */}
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {r.percentage}%
                    </td>

                    {/* Time Taken */}
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                      {r.timeTakenFormatted}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.isPassed
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    {/* Submitted At */}
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(r._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{pagination.pages}</strong> ({pagination.total} total reports)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Result View Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Student Test Submission Detail"
        maxWidth="max-w-3xl"
      >
        {detailLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-semibold">
            Loading student submission breakdown...
          </div>
        ) : !detailAttempt ? (
          <div className="py-8 text-center text-xs text-rose-500 font-semibold">
            Could not retrieve submission detail.
          </div>
        ) : (
          <div className="space-y-6 text-xs py-2">
            {/* Student Info Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {detailAttempt.studentId?.name}
                </h3>
                <p className="text-slate-500">{detailAttempt.studentId?.email}</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Submitted on {new Date(detailAttempt.submittedAt || detailAttempt.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {detailAttempt.score} / {detailAttempt.maxMarks}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    detailAttempt.accuracy >= 40 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                  }`}
                >
                  {detailAttempt.accuracy}% Accuracy
                </span>
              </div>
            </div>

            {/* Questions list breakdown */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {detailQuestions.map((q, idx) => {
                const isCorrect = q.isCorrect;
                const isUnattempted = q.selectedOptionIndex === null || q.selectedOptionIndex === undefined;

                return (
                  <div
                    key={q._id}
                    className={`p-4 rounded-2xl border ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : isUnattempted
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-400">Q{idx + 1} ({q.marks} Marks)</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : isUnattempted
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-rose-500/20 text-rose-600'
                        }`}
                      >
                        {isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 dark:text-white mb-2">{q.questionText}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                      {q.options.map((opt, optIdx) => {
                        const isUserChoice = q.selectedOptionIndex === optIdx;
                        const isRightAnswer = q.correctAnswerIndex === optIdx;

                        let style = 'border-slate-200 dark:border-slate-700';
                        if (isRightAnswer) style = 'border-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold';
                        else if (isUserChoice && !isRightAnswer) style = 'border-rose-500 bg-rose-100/50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200';

                        return (
                          <div key={optIdx} className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${style}`}>
                            <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                            {isRightAnswer && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isUserChoice && !isRightAnswer && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherReports;
