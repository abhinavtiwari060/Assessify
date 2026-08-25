import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  KeyRound,
  Clock,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirmation modal state
  const [selectedReq, setSelectedReq] = useState(null);
  const [resetting, setResetting] = useState(false);

  // One-time result modal state
  const [resultData, setResultData] = useState(null);
  const [copied, setCopied] = useState(false);

  const { addToast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/password-resets');
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to load password reset requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmReset = async () => {
    if (!selectedReq) return;

    setResetting(true);
    try {
      const res = await api.post(`/admin/password-resets/${selectedReq._id}/reset`);
      addToast(`Password reset successfully for ${selectedReq.userName}`, 'success');

      setResultData({
        temporaryPassword: res.data.temporaryPassword,
        userName: res.data.user.name,
        userEmail: res.data.user.email,
        userRole: res.data.user.role,
      });

      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (resultData?.temporaryPassword) {
      navigator.clipboard.writeText(resultData.temporaryPassword);
      setCopied(true);
      addToast('Temporary password copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.userName?.toLowerCase().includes(search.toLowerCase()) ||
      req.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  if (loading && requests.length === 0) return <CardSkeleton />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner - Theme Adaptive Surface */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FA8128]/15 border border-[#FA8128]/30 text-xs font-bold text-[#FA8128]">
          <KeyRound className="w-3.5 h-3.5" /> Password Administration
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">Password Reset Requests</h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-2xl leading-relaxed">
          Review password reset requests from students and teachers. Generate secure temporary passwords and manually communicate them to users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Pending Requests</div>
            <div className="text-2xl font-extrabold text-[#FA8128] mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Processed Resets</div>
            <div className="text-2xl font-extrabold text-[#22C55E] mt-1">{completedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#22C55E] flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Requests</div>
            <div className="text-2xl font-extrabold text-[var(--text-main)] mt-1">{requests.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-main)] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-bold">
            <Filter className="w-4 h-4" /> Filter:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button
            onClick={fetchRequests}
            className="p-2 text-[var(--text-muted)] hover:text-[#FA8128] rounded-xl hover:bg-[var(--bg-sub)] transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
            <KeyRound className="w-10 h-10 mx-auto opacity-40 text-[#FA8128]" />
            <div className="text-base font-bold text-[var(--text-main)]">No Password Reset Requests Found</div>
            <p className="text-xs max-w-sm mx-auto text-[var(--text-sub)]">
              There are currently no password reset requests matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-sub)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Requested At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'PENDING';
                  return (
                    <tr key={req._id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="p-4 font-bold text-[var(--text-main)]">
                        {req.userName}
                      </td>
                      <td className="p-4 font-semibold text-[#FA8128]">
                        {req.email}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          req.role === 'teacher'
                            ? 'bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30'
                            : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                        }`}>
                          {req.role}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-sub)]">
                        {new Date(req.requestedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30'
                            : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                        }`}>
                          {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Reset Password
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Processed {req.processedByName ? `by ${req.processedByName}` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[var(--border)] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                Confirm Password Reset
              </h3>
              <p className="text-xs text-[var(--text-sub)] leading-relaxed">
                Are you sure you want to reset the password for{' '}
                <strong className="text-[var(--text-main)]">{selectedReq.userName}</strong> (
                <span className="font-semibold text-[#FA8128]">{selectedReq.email}</span>)?
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-sub)] rounded-xl text-xs text-[var(--text-sub)] border border-[var(--border)] space-y-1">
              <div className="font-bold text-[var(--text-main)]">What will happen:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>A secure 10-character temporary password will be generated.</li>
                <li>The user will be forced to set a new password upon login.</li>
                <li>You must manually give the temporary password to the user.</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReq(null)}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-main)] font-bold text-xs bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {resetting ? 'Generating Temp Password...' : 'Yes, Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-Time Temporary Password Display Modal */}
      {resultData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[var(--border)] shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)]">
                  Password Reset Successful!
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  Temporary password generated for user
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="bg-[var(--bg-sub)] rounded-2xl p-4 border border-[var(--border)] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-sub)] font-semibold">User Name:</span>
                <span className="font-bold text-[var(--text-main)]">{resultData.userName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-sub)] font-semibold">User Email:</span>
                <span className="font-bold text-[#FA8128]">{resultData.userEmail}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--text-sub)] font-semibold">Role:</span>
                <span className="font-bold uppercase text-[var(--text-main)]">{resultData.userRole}</span>
              </div>
            </div>

            {/* One-Time Temporary Password Display */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-sub)]">
                One-Time Temporary Password
              </label>
              <div className="flex items-center gap-2 p-3.5 bg-[var(--bg-sub)] border-2 border-[#FA8128]/60 rounded-2xl text-[var(--text-main)] font-mono text-xl tracking-wider justify-between shadow-inner">
                <span className="select-all font-bold text-[#FA8128]">{resultData.temporaryPassword}</span>
                <button
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white text-xs font-sans font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Security Warning Notice */}
            <div className="bg-[#FA8128]/10 border border-[#FA8128]/30 rounded-2xl p-4 flex items-start gap-3 text-[#FA8128] text-xs">
              <AlertTriangle className="w-5 h-5 text-[#FA8128] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-[var(--text-main)]">Important Notice for Administrator:</strong>
                <p className="text-[11px] leading-relaxed text-[var(--text-sub)]">
                  Manually communicate this temporary password to the user via WhatsApp, phone call, or in person. For security, this temporary password will expire in 24 hours and will <strong>NOT</strong> be displayed again after closing this window.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResultData(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequests;
