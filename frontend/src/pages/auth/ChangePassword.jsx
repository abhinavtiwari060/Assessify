import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D1117] text-[#F0F6FC]">
      <div className="max-w-sm sm:max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#58A6FF] text-[#0D1117] flex items-center justify-center font-black shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#F0F6FC] tracking-tight">Set New Permanent Password</h2>
          <p className="text-xs text-[#8B949E]">
            {isForced
              ? 'You logged in using a temporary password. You must change your password before continuing.'
              : 'Update your account password securely.'}
          </p>
        </div>

        {isForced && (
          <div className="bg-[#D29922]/10 border border-[#D29922]/30 rounded-2xl p-4 flex items-start gap-3 text-[#D29922] text-xs">
            <ShieldAlert className="w-5 h-5 text-[#D29922] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-[#F0F6FC]">Security Requirement: </strong>
              Your temporary password remains valid only until you set your permanent password.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
              Current / Temporary Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current or temporary password"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
              New Permanent Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
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
