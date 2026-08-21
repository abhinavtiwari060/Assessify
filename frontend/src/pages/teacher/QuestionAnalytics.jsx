import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { BarChart3, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const QuestionAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/teacher');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load question analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <TableSkeleton />;

  const questions = analytics?.questionAnalytics || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-500" />
          Question Item Difficulty Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Identify problematic or highly difficult test questions based on empirical student response rates.
        </p>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="No question attempt data yet"
          description="Analytics will populate as students complete your tests."
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Question Text</th>
                  <th className="px-6 py-4">Difficulty Level</th>
                  <th className="px-6 py-4">Correct %</th>
                  <th className="px-6 py-4">Wrong %</th>
                  <th className="px-6 py-4">Avg Time</th>
                  <th className="px-6 py-4">Times Answered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {q.questionText}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        q.difficultyLabel.includes('High')
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : q.difficultyLabel.includes('Low')
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {q.difficultyLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {q.correctPercentage}%
                    </td>
                    <td className="px-6 py-4 font-extrabold text-rose-600 dark:text-rose-400">
                      {q.wrongPercentage}%
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {q.avgTimeSeconds}s
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {q.timesAnswered}
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

export default QuestionAnalytics;
