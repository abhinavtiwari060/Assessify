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
          <p className="text-xs text-slate-400 font-normal">Account Password Recovery</p>
        </div>

        {submitted ? (
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Reset Request Submitted</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password reset request has been submitted to the administrator.
              </p>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/60 text-[11px] text-slate-400 text-left space-y-1 mt-3">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> What happens next?
                </div>
                <p>
                  The platform administrator will review your request, verify your account email, and manually communicate your temporary password to you via phone, WhatsApp, or in person.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@domain.com or teacher@domain.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-0.5">
                Enter your registered account email to request a password reset from the administrator.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors active:scale-[0.99] disabled:opacity-50 mt-1"
            >
              {loading ? 'Submitting Request...' : 'Submit Reset Request'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="pt-2 text-center border-t border-slate-700/60">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium">
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
