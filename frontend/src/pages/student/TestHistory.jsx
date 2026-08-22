import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { History, Award, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

const TestHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/attempts/history/me');
        setAttempts(res.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Test History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your past test attempts, scores, and evaluation feedback.
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : attempts.length === 0 ? (
        <EmptyState title="No test history found" description="Take an MCQ or Essay test to see your completed attempts here." />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Test Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {attempts.map((att) => {
                  const passingRate = att.testId?.passingPercentage || 40;
                  const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
                  const isPassed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;

                  return (
                    <tr key={att._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {att.testId?.title || 'Assessment Test'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {att.testId?.subjectId?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                        {att.score} / {att.maxMarks}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {pct}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isPassed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isPassed ? 'Passed' : 'Needs Improvement'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/student/attempt/${att._id}/result`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <span>View Result</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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

export default TestHistory;
