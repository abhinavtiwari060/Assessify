import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Trophy, Info, RotateCcw, AlertTriangle } from 'lucide-react';

const Leaderboard = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [leaderboard, setLeaderboard] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  const handleResetLeaderboard = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const res = await api.post('/admin/leaderboard/reset');
      addToast(res.data.message || 'Leaderboard reset successfully!', 'success');
      setResetModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to reset leaderboard:', err);
      addToast(err.response?.data?.message || 'Failed to reset leaderboard', 'error');
    } finally {
      setResetting(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1)
      return (
        <div className="w-8 h-8 rounded-xl bg-[#FA8128] text-white font-black flex items-center justify-center shadow-xs">
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
            <Trophy className="w-8 h-8 text-[#FA8128]" />
            Global Platform Leaderboard
          </h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Top performing students ranked by total score, accuracy %, and completion efficiency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Leaderboard Reset Control */}
          {isAdmin && (
            <button
              onClick={() => setResetModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Reset Leaderboard</span>
            </button>
          )}

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
          >
            <option value="">All Subjects Leaderboard</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transparent Ranking Rule Explanation Banner */}
      <div className="bg-[#FA8128]/10 border border-[#FA8128]/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#FA8128]">
        <Info className="w-5 h-5 shrink-0 text-[#FA8128]" />
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
                      item.rank <= 3 ? 'bg-[#FA8128]/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">{getRankBadge(item.rank)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FA8128] text-white flex items-center justify-center font-black text-sm">
                          {item.student.name ? item.student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-main)]">{item.student.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{item.recentTestTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#FA8128] text-base">
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

      {/* Admin Leaderboard Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => !resetting && setResetModalOpen(false)}
        title="Reset Platform Leaderboard"
        footer={
          <>
            <button
              onClick={() => setResetModalOpen(false)}
              disabled={resetting}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-main)] bg-[var(--bg-sub)] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResetLeaderboard}
              disabled={resetting}
              className="px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {resetting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-white animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Confirm Reset</span>
              )}
            </button>
          </>
        }
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-extrabold text-[var(--text-main)]">Reset Leaderboard Cutoff?</h4>
          <p className="text-xs text-[var(--text-sub)] leading-relaxed max-w-sm mx-auto">
            This will reset the current leaderboard rankings. Student test history, exam scores, and report cards will <strong>NOT</strong> be deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Leaderboard;
