import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Mail, Lock, User, Hash, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D1117] text-[#F0F6FC]">
      <div className="max-w-sm sm:max-w-md w-full space-y-6">
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#58A6FF] text-[#0D1117] flex items-center justify-center font-black shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#F0F6FC] tracking-tight">Create Assessify Account</h2>
          <p className="text-xs text-[#8B949E]">Sign up as a student or teacher to access the platform</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl space-y-4">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#21262D] rounded-xl border border-[#30363D]">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'student'
                  ? 'bg-[#58A6FF] text-[#0D1117] shadow-xs'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'teacher'
                  ? 'bg-[#58A6FF] text-[#0D1117] shadow-xs'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              Teacher
            </button>
          </div>

          {role === 'teacher' && (
            <div className="p-3 bg-[#D29922]/10 border border-[#D29922]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#D29922]">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-[#F0F6FC]">Approval Required: </strong>
                Teacher registrations must be approved by an administrator before creating tests.
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          {role === 'student' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Roll / ID Number (Optional)</label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="CS2026-042"
                  className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-2 text-center text-xs text-[#8B949E]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#58A6FF] hover:underline">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
