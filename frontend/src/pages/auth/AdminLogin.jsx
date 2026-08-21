import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both admin email and password');
      return;
    }

    try {
      setLoading(true);
      await adminLogin(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to authenticate as administrator. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md space-y-5 relative z-10">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5.5 h-5.5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
              Assessify Admin
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Administrator Portal Sign In
          </h1>
          <p className="text-xs text-slate-400 font-normal">
            Secure Restricted Portal • System Operations & Moderation
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleAdminLogin}
          className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xl space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs sm:text-sm mt-1"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-700/60 text-center font-normal">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Standard Student / Teacher Portal Sign In →</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
