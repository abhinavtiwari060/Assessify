import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { Trophy, Medal, Award, Clock, Target, Info } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lbRes, subRes] = await Promise.all([
          api.get(`/analytics/leaderboard${selectedSubject ? `?subjectId=${selectedSubject}` : ''}`),
          api.get('/subjects'),
        ]);
        setLeaderboard(lbRes.data);
        setSubjects(subRes.data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSubject]);

  const getRankBadge = (rank) => {
    if (rank === 1)
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center shadow-md shadow-amber-400/40">
          🥇
        </div>
      );
    if (rank === 2)
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-bold flex items-center justify-center shadow-md">
          🥈
        </div>
      );
    if (rank === 3)
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-bold flex items-center justify-center shadow-md">
          🥉
        </div>
      );
    return <span className="font-extrabold text-sm text-slate-500">#{rank}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            Global Platform Leaderboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top performing students ranked by total score, accuracy %, and completion efficiency.
          </p>
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Subjects Leaderboard</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Transparent Ranking Rule Explanation Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-800 dark:text-indigo-200">
        <Info className="w-5 h-5 shrink-0 text-indigo-500" />
        <div>
          <strong>Transparent Ranking Formula: </strong>
          Primary: Peak Score Obtained → Secondary: High Accuracy Percentage → Tertiary (Tiebreaker): Speed / Completion Time.
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <TableSkeleton />
      ) : leaderboard.length === 0 ? (
        <EmptyState title="No leaderboard entries yet" description="Complete an assessment test to claim your spot on the leaderboard!" />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Peak Score</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">Best Time</th>
                  <th className="px-6 py-4">Total Tests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {leaderboard.map((item) => (
                  <tr
                    key={item.student._id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors ${
                      item.rank <= 3 ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">{getRankBadge(item.rank)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {item.student.name ? item.student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.student.name}</div>
                          <div className="text-xs text-slate-400">{item.recentTestTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
                      {item.bestScore} pts
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {item.bestAccuracy}%
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {item.bestTimeSeconds ? `${Math.floor(item.bestTimeSeconds / 60)}m ${item.bestTimeSeconds % 60}s` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {item.totalAttempts} tests
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

export default Leaderboard;
