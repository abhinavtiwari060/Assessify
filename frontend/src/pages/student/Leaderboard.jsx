import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { Trophy, Info } from 'lucide-react';

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
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-[#0A0A0A] font-black flex items-center justify-center shadow-xs">
          🥇
        </div>
      );
    if (rank === 2)
      return (
        <div className="w-8 h-8 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] font-black flex items-center justify-center">
          🥈
        </div>
      );
    if (rank === 3)
      return (
        <div className="w-8 h-8 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] font-black flex items-center justify-center">
          🥉
        </div>
      );
    return <span className="font-extrabold text-sm text-[var(--text-muted)]">#{rank}</span>;
  };

  return (
    <div className="space-y-8 text-[var(--text-main)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-[#F59E0B]" />
            Global Platform Leaderboard
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Top performing students ranked by total score, accuracy %, and completion efficiency.
          </p>
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
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
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#F59E0B]">
        <Info className="w-5 h-5 shrink-0 text-[#F59E0B]" />
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
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-sub)] text-xs uppercase text-[var(--text-muted)] font-extrabold border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Peak Score</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">Best Time</th>
                  <th className="px-6 py-4">Total Tests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {leaderboard.map((item) => (
                  <tr
                    key={item.student._id}
                    className={`hover:bg-[var(--bg-sub)] transition-colors ${
                      item.rank <= 3 ? 'bg-[#F59E0B]/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">{getRankBadge(item.rank)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-[#0A0A0A] flex items-center justify-center font-black text-sm">
                          {item.student.name ? item.student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-main)]">{item.student.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{item.recentTestTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#F59E0B] text-base">
                      {item.bestScore} pts
                    </td>
                    <td className="px-6 py-4 font-bold text-[#22C55E]">
                      {item.bestAccuracy}%
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)]">
                      {item.bestTimeSeconds ? `${Math.floor(item.bestTimeSeconds / 60)}m ${item.bestTimeSeconds % 60}s` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--text-sub)]">
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
