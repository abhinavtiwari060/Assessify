import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Clock, ShieldAlert, LogOut, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';

const PendingApproval = () => {
  const { user, logout, checkStatus } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updatedUser = await checkStatus();
      if (updatedUser && updatedUser.isApproved !== false) {
        addToast('Your teacher account has been approved! Redirecting to dashboard...', 'success');
        navigate('/teacher/dashboard', { replace: true });
      } else {
        addToast('Your account is still pending admin approval.', 'info');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to refresh status. Please try again later.', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 max-w-xl w-full shadow-xl space-y-6 text-center">
        {/* Animated Badge Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Pending Approval
          </span>
        </div>

        {/* Header & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account Pending Approval
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Your teacher account is currently pending admin approval. You will get access to teacher features once an administrator approves your account.
          </p>
        </div>

        {/* User Details Card */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Email</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[300px]">
                {user?.email || 'N/A'}
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Role: Teacher
            </span>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300 text-left flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Once an administrator grants approval, you can refresh this status or re-login to instantly access your teacher dashboard, course management, analytics, and creation tools.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Status...' : 'Check Approval Status'}
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
