import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Mail, Lock, ArrowRight, Sparkles, UserCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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

  const setQuickDemoUser = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-600/15 blur-3xl rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Assessify</h2>
          <p className="text-sm text-slate-400">Online Assessment & MCQ/Essay Evaluation Engine</p>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Quick One-Click Demo Logins</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setQuickDemoUser('student@platform.com', 'student123')}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl border border-slate-600/60 text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Student Demo</div>
                <div className="text-[10px] text-slate-400">Alex Johnson</div>
              </div>
            </button>

            <button
              onClick={() => setQuickDemoUser('teacher@platform.com', 'teacher123')}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl border border-slate-600/60 text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Teacher A</div>
                <div className="text-[10px] text-slate-400">Prof. Turing</div>
              </div>
            </button>

            <button
              onClick={() => setQuickDemoUser('teacher2@platform.com', 'teacher123')}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl border border-slate-600/60 text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Teacher B</div>
                <div className="text-[10px] text-slate-400">Dr. Hopper</div>
              </div>
            </button>

            <button
              onClick={() => setQuickDemoUser('admin@platform.com', 'admin123')}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 rounded-xl border border-slate-600/60 text-left transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Admin Demo</div>
                <div className="text-[10px] text-slate-400">Platform Admin</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In to Account'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:underline">
              Create student or teacher account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
