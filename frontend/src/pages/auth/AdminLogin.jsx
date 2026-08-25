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
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-[#F85149] text-[#0D1117] flex items-center justify-center font-black shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-[#F0F6FC] tracking-tight">
              Assessify Admin
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-[#F0F6FC] tracking-tight">
            Administrator Portal Sign In
          </h1>
          <p className="text-xs text-[#8B949E]">
            Secure Restricted Portal • System Operations & Moderation
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleAdminLogin}
          className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl space-y-4"
        >
          {error && (
            <div className="p-3 rounded-xl bg-[#F85149]/15 border border-[#F85149]/30 text-[#F85149] text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#F85149] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#21262D] border border-[#30363D] rounded-xl text-[#F0F6FC] placeholder-[#8B949E] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F85149]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#21262D] border border-[#30363D] rounded-xl text-[#F0F6FC] placeholder-[#8B949E] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F85149]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F85149] hover:bg-[#da3633] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs sm:text-sm cursor-pointer mt-1"
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

          <div className="pt-3 border-t border-[#30363D] text-center font-normal">
            <Link
              to="/login"
              className="text-xs text-[#8B949E] hover:text-[#58A6FF] transition-colors inline-flex items-center gap-1.5 font-semibold"
            >
              <GraduationCap className="w-4 h-4 text-[#58A6FF]" />
              <span>Standard Student / Teacher Portal Sign In →</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
