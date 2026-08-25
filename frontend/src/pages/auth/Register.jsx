import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Mail, Lock, User, Hash, ArrowRight, Clock } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await register({
        name,
        email,
        password,
        role,
        rollNo: role === 'student' ? rollNo : undefined,
      });

      addToast('Registration successful!', 'success');

      if (userData.role === 'teacher' && userData.isApproved === false) {
        navigate('/teacher/pending-approval');
      } else if (userData.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      <div className="max-w-sm sm:max-w-md w-full space-y-6">
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F59E0B] text-[#0A0A0A] flex items-center justify-center font-black shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Create Assessify Account</h2>
          <p className="text-xs text-[var(--text-sub)]">Sign up as a student or teacher to access the platform</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-sub)] rounded-xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === 'student'
                  ? 'bg-[#F59E0B] text-[#0A0A0A] shadow-xs'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === 'teacher'
                  ? 'bg-[#F59E0B] text-[#0A0A0A] shadow-xs'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              Teacher
            </button>
          </div>

          {role === 'teacher' && (
            <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#F59E0B]">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[var(--text-main)]">Approval Required: </strong>
                Teacher registrations must be approved by an administrator before creating tests.
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          {role === 'student' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Roll / ID Number (Optional)</label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="CS2026-042"
                  className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            {!loading && <ArrowRight className="w-4 h-4 text-[#0A0A0A]" />}
          </button>

          <div className="pt-2 text-center text-xs text-[var(--text-sub)]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#F59E0B] hover:underline">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

