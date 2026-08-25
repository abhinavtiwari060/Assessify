import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your registered email address', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to submit request. Please try again.', 'error');
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
          <h2 className="text-2xl font-extrabold text-[#F0F6FC] tracking-tight">Assessify</h2>
          <p className="text-xs text-[#8B949E]">Account Password Recovery</p>
        </div>

        {submitted ? (
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#3FB950]/15 border border-[#3FB950]/30 text-[#3FB950] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#F0F6FC]">Reset Request Submitted</h3>
              <p className="text-xs text-[#8B949E] leading-relaxed">
                Your password reset request has been submitted to the administrator.
              </p>
              <div className="p-3 bg-[#21262D] rounded-xl border border-[#30363D] text-[11px] text-[#8B949E] text-left space-y-1 mt-3">
                <div className="font-bold text-[#F0F6FC] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#58A6FF]" /> What happens next?
                </div>
                <p>
                  The platform administrator will review your request, verify your account email, and manually communicate your temporary password to you via phone, WhatsApp, or in person.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#30363D]">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#58A6FF] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@domain.com or teacher@domain.com"
                  className="w-full bg-[#21262D] border border-[#30363D] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
                />
              </div>
              <p className="text-[11px] text-[#8B949E] pt-0.5">
                Enter your registered account email to request a password reset from the administrator.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? 'Submitting Request...' : 'Submit Reset Request'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="pt-2 text-center border-t border-[#30363D]">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC] font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
