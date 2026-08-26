import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput';
import { KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

const ChangePassword = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and confirmation do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      addToast('Password updated successfully! Welcome to your dashboard.', 'success');
      updateUser({ mustChangePassword: false });

      if (user?.role === 'student') navigate('/student/dashboard');
      else if (user?.role === 'teacher') navigate('/teacher/dashboard');
      else if (user?.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update password. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isForced = user?.mustChangePassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      <div className="max-w-sm sm:max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FA8128] text-white flex items-center justify-center font-black shadow-xs">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Set New Permanent Password</h2>
          <p className="text-xs text-[var(--text-sub)]">
            {isForced
              ? 'You logged in using a temporary password. You must change your password before continuing.'
              : 'Update your account password securely.'}
          </p>
        </div>

        {isForced && (
          <div className="bg-[#FA8128]/10 border border-[#FA8128]/30 rounded-2xl p-4 flex items-start gap-3 text-[#FA8128] text-xs">
            <ShieldAlert className="w-5 h-5 text-[#FA8128] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-[var(--text-main)]">Security Requirement: </strong>
              Your temporary password remains valid only until you set your permanent password.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-sub)]">
              Current / Temporary Password
            </label>
            <PasswordInput
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current or temporary password"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-sub)]">
              New Permanent Password
            </label>
            <PasswordInput
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-sub)]">
              Confirm New Password
            </label>
            <PasswordInput
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Saving Password...' : 'Save New Password & Continue'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
