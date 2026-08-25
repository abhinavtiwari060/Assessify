import React from 'react';
import { GraduationCap, CheckCircle2, ShieldCheck, FileCheck2, FileUp, BookOpen, BarChart3 } from 'lucide-react';

const About = () => {
  const keyFeatures = [
    {
      title: 'MCQ & Speed Examinations',
      description: 'Support for overall test timers and strict per-question countdown timers with customizable negative marking rules.',
      icon: FileCheck2,
    },
    {
      title: 'Automated PDF to MCQ Extractor',
      description: 'Upload PDF exam papers to automatically parse questions, choices, and answers into digital interactive tests.',
      icon: FileUp,
    },
    {
      title: 'Anti-Cheating Window Tracking',
      description: 'Monitors browser visibility loss and tab switching during active tests to log focus violation records.',
      icon: ShieldCheck,
    },
    {
      title: 'Essay Writing & Teacher Evaluation',
      description: 'Timed essay assessment environment with instructor evaluation queues and detailed feedback features.',
      icon: BookOpen,
    },
    {
      title: 'Subject Analytics & Report Cards',
      description: 'Granular question difficulty distribution for teachers and individual student progress report cards.',
      icon: BarChart3,
    },
  ];

  return (
    <div className="py-8 sm:py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FA8128] text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              About Assessify
            </h1>
            <p className="text-xs text-[var(--text-sub)]">
              Online Examination & Evaluation Platform
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-main)]">
          About the Platform
        </h2>
        <div className="space-y-3 text-sm text-[var(--text-sub)] leading-relaxed">
          <p>
            <strong>Assessify</strong> is a modern online examination and evaluation platform designed for educational institutions, educators, and students.
          </p>
          <p>
            The platform simplifies test administration by offering automated PDF question parsing, timed MCQ examinations, essay submissions, anti-cheating window tracking, and real-time performance analytics.
          </p>
          <p>
            <strong>What Problem It Solves:</strong> Traditional testing often requires time-consuming manual grading and lacks real-time insight into student mastery. Assessify streamlines test creation, ensures academic integrity during online exams, and provides instant, actionable feedback.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-main)]">
          Key Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-[#FA8128]/15 text-[#FA8128] shrink-0 border border-[#FA8128]/30">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default About;
