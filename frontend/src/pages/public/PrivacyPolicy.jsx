import React from 'react';
import { ShieldCheck, Calendar, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = 'August 21, 2026';

  const sections = [
    {
      title: '1. Introduction',
      content: 'Welcome to Assessify. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how data is collected, used, and safeguarded when using our educational examination platform.',
    },
    {
      title: '2. Information We Collect',
      content: 'Assessify collects essential information required for platform authentication and academic scoring:',
      items: [
        'Account Credentials: Full Name, Email Address, Roll Number (for students), Biography, and Password (stored as salted bcrypt hashes).',
        'Test & Attempt Data: Answers submitted for MCQ examinations, essay submissions, start and completion timestamps, scores, and accuracy percentages.',
        'Proctoring Logs: Focus switch counters and window visibility change events logged during active test sessions.',
      ],
    },
    {
      title: '3. How We Use Information',
      content: 'Information collected is used solely to facilitate educational testing and analytics:',
      items: [
        'Calculating test scores, accuracy percentages, and leaderboard positions.',
        'Generating student Report Cards and Subject Mastery charts.',
        'Providing teachers with question analytics and essay evaluation interfaces.',
        'Enforcing test duration timers and maximum attempt limits.',
      ],
    },
    {
      title: '4. Test/Student Data Protection',
      content: 'Student test responses and performance records are accessible only to the student, course instructors, and platform administrators. Questions and answers are protected against unauthorized modification.',
    },
    {
      title: '5. Data Security',
      content: 'Passwords are encrypted using bcrypt hashing before storage. We enforce strict role-based access control (RBAC) on all API endpoints with JSON Web Token (JWT) verification.',
    },
    {
      title: '6. Cookies & Local Storage',
      content: 'Assessify uses browser local storage (localStorage) to persist user session tokens and role state across page refreshes. We do not use third-party advertising cookies.',
    },
    {
      title: '7. Third-Party Services',
      content: 'Assessify supports optional Google OAuth authentication via Firebase SDK for single sign-on convenience. When using Google Sign-In, only basic identity details (name, email, profile picture) are accessed.',
    },
    {
      title: '8. Data Retention',
      content: 'Test history and account data are retained for active users to support ongoing academic evaluations. Accounts can be deactivated or removed upon request.',
    },
    {
      title: '9. Changes to Privacy Policy',
      content: 'This policy may be updated periodically to reflect platform updates. Material changes will be indicated on this page with a revised "Last Updated" date.',
    },
    {
      title: '10. Contact Information',
      content: 'If you have questions regarding this Privacy Policy or your data, please contact our support team at:',
      contact: 'support@assessify.com',
    },
  ];

  return (
    <div className="py-8 sm:py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border)] space-y-2">
        <div className="flex items-center gap-2 text-[#FA8128] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Platform Privacy Document</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
          Privacy Policy
        </h1>
        <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last Updated: <strong>{lastUpdated}</strong></span>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm space-y-2"
          >
            <h2 className="text-base font-bold text-[var(--text-main)]">
              {section.title}
            </h2>
            <p className="text-sm text-[var(--text-sub)] leading-relaxed">
              {section.content}
            </p>

            {section.items && (
              <ul className="mt-2 space-y-1.5 pl-4 text-xs text-[var(--text-sub)]">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FA8128] mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.contact && (
              <div className="mt-2 text-xs font-semibold text-[#FA8128] flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${section.contact}`} className="hover:underline">
                  {section.contact}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
