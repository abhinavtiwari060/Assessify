import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { ArrowRight } from 'lucide-react';

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
    <div className="space-y-6 max-w-7xl mx-auto text-[var(--text-main)]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          My Test History
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
          Review your past test attempts, scores, and evaluation feedback.
        </p>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : attempts.length === 0 ? (
        <EmptyState title="No test history found" description="Take an MCQ or Essay test to see your completed attempts here." />
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--bg-sub)] text-[11px] uppercase text-[var(--text-muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3.5">Test Title</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Percentage</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {attempts.map((att) => {
                  const passingRate = att.testId?.passingPercentage || 40;
                  const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
                  const isPassed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;

                  return (
                    <tr key={att._id} className="hover:bg-[var(--bg-sub)] transition-colors">
                      <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                        {att.testId?.title || 'Assessment Test'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[var(--bg-sub)] text-[#F59E0B] border border-[var(--border)]">
                          {att.testId?.subjectId?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-extrabold text-[#F59E0B]">
                        {att.score} / {att.maxMarks}
                      </td>
                      <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                        {pct}%
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isPassed ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30' : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        }`}>
                          {isPassed ? 'Passed' : 'Needs Improvement'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                        {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/student/attempt/${att._id}/result`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#F59E0B] hover:underline"
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

