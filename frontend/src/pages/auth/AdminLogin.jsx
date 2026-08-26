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
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444] text-[#FFFFFF] flex items-center justify-center font-black shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
              Assessify Admin
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
            Administrator Portal Sign In
          </h1>
          <p className="text-xs text-[var(--text-sub)]">
            Secure Restricted Portal • System Operations & Moderation
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleAdminLogin}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#EF4444] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs sm:text-sm cursor-pointer mt-1"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate Administrator</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-[var(--border)] text-center font-normal">
            <Link
              to="/login"
              className="text-xs text-[var(--text-sub)] hover:text-[#FA8128] transition-colors inline-flex items-center gap-1.5 font-semibold"
            >
              <GraduationCap className="w-4 h-4 text-[#FA8128]" />
              <span>Standard Student / Teacher Portal Sign In →</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

