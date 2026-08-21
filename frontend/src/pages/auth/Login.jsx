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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success');

      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none"></div>

      <div className="max-w-sm sm:max-w-md w-full relative z-10 space-y-5">
        {/* Logo Banner */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Assessify</h2>
          <p className="text-xs text-slate-400 font-normal">Online Assessment & MCQ/Essay Evaluation Engine</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50 mt-1"
          >
            {loading ? 'Signing In...' : 'Sign In to Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-2 text-center space-y-1.5 text-xs text-slate-400 font-normal">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-400 hover:underline">
                Create student or teacher account
              </Link>
            </p>
            <p className="pt-1.5 border-t border-slate-700/60">
              Platform Administrator?{' '}
              <Link to="/admin/login" className="font-semibold text-rose-400 hover:underline">
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
