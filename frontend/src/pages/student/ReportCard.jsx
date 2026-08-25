import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Award,
  Printer,
  BookOpen,
  GraduationCap,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-[var(--text-main)]">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            Official Student Report Card
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Comprehensive evaluation statement of subject proficiency and assessment scores.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Card Container */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-8 sm:p-10 border border-[var(--border)] shadow-xs space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header Header Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-8 border-b border-[var(--border)] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FA8128] text-white flex items-center justify-center font-black text-2xl shadow-xs">
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">{student.name}</h2>
              <p className="text-xs text-[var(--text-sub)]">{student.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                  Active Enrolled Student
                </span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-base font-bold text-[#FA8128] justify-end">
              <GraduationCap className="w-5 h-5" /> Assessify Platform
            </div>
            <p className="text-xs text-[var(--text-muted)]">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Tests Attempted</div>
            <div className="text-3xl font-extrabold text-[var(--text-main)]">{summary.totalMcqAttempts}</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Average Accuracy</div>
            <div className="text-3xl font-extrabold text-[#22C55E]">{summary.averageAccuracy}%</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Total Points</div>
            <div className="text-3xl font-extrabold text-[#FA8128]">{summary.totalScoreObtained}</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Questions Solved</div>
            <div className="text-3xl font-extrabold text-[var(--text-main)]">{summary.totalQuestionsAttempted}</div>
          </div>
        </div>

        {/* Subject-Wise Performance Breakdown */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FA8128]" />
            Subject Proficiency Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report?.subjectBreakdown?.map((sub, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)]">{sub.subjectName}</h4>
                    <span className="text-xs text-[var(--text-muted)]">Code: {sub.code}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    sub.status === 'Strong'
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                      : 'bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-sub)]">Accuracy Rate:</span>
                  <span className="font-extrabold text-[var(--text-main)]">{sub.accuracy}%</span>
                </div>

                <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.accuracy >= 75 ? 'bg-[#22C55E]' : 'bg-[#FA8128]'}`}
                    style={{ width: `${sub.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Evaluated Essay Feedback */}
        {report?.evaluatedEssays?.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FA8128]" />
              Evaluated Essays & Teacher Feedback
            </h3>

            <div className="space-y-3">
              {report.evaluatedEssays.map((essay, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-main)]">{essay.testTitle}</span>
                    <span className="text-xs font-extrabold text-[#FA8128]">
                      {essay.marksObtained} / {essay.maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)] leading-relaxed italic">
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

