import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Award,
  Printer,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

const ReportCard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/analytics/report-card/me');
        setReport(res.data);
      } catch (err) {
        console.error('Failed to load report card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <CardSkeleton />;

  const summary = report?.summary || {};
  const student = report?.student || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Official Student Report Card
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive evaluation statement of subject proficiency and assessment scores.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Card Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-700/80 shadow-xl space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header Header Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{student.name}</h2>
              <p className="text-sm text-slate-500">{student.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active Enrolled Student
                </span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400 justify-end">
              <GraduationCap className="w-5 h-5" /> Assessify Academy
            </div>
            <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Tests Attempted</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{summary.totalMcqAttempts}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Average Accuracy</div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.averageAccuracy}%</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Total Points</div>
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{summary.totalScoreObtained}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Questions Solved</div>
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{summary.totalQuestionsAttempted}</div>
          </div>
        </div>

        {/* Subject-Wise Performance Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Subject Proficiency Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report?.subjectBreakdown?.map((sub, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{sub.subjectName}</h4>
                    <span className="text-xs text-slate-400">Code: {sub.code}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sub.status === 'Strong'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-slate-500">Accuracy Rate:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{sub.accuracy}%</span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.accuracy >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${sub.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Evaluated Essay Feedback */}
        {report?.evaluatedEssays?.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Evaluated Essays & Teacher Feedback
            </h3>

            <div className="space-y-3">
              {report.evaluatedEssays.map((essay, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-purple-900 dark:text-purple-200">{essay.testTitle}</span>
                    <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                      {essay.marksObtained} / {essay.maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{essay.feedback || 'Great effort demonstrated.'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
