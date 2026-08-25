import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login(email, password);
      addToast(`Welcome back, ${userData.name}!`, 'success');

      if (userData.mustChangePassword) {
        navigate('/change-password');
      } else if (userData.role === 'student') {
        navigate('/student/dashboard');
      } else if (userData.role === 'teacher') {
        navigate(userData.isApproved !== false ? '/teacher/dashboard' : '/teacher/pending-approval');
      } else if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      <div className="max-w-sm sm:max-w-md w-full space-y-6">
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FA8128] text-white flex items-center justify-center font-black shadow-xs">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Assessify Platform</h2>
          <p className="text-xs text-[var(--text-sub)]">Sign in to access your student or instructor workspace</p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@domain.com or teacher@domain.com"
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-[#FA8128] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In to Account'}
            {!loading && <ArrowRight className="w-4 h-4 text-white" />}
          </button>

          <div className="pt-3 text-center space-y-2 text-xs text-[var(--text-sub)]">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#FA8128] hover:underline">
                Create student or teacher account
              </Link>
            </p>
            <p className="pt-2 border-t border-[var(--border)]">
              Platform Administrator?{' '}
              <Link to="/admin/login" className="font-bold text-[#EF4444] hover:underline">
                Access Admin Portal
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

