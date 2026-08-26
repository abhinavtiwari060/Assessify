import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  FileEdit,
  History,
  Trophy,
  Award,
  PlusCircle,
  FileUp,
  GraduationCap,
  Users,
  BookOpen,
  BarChart3,
  X,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  Clock,
  Code2,
  KeyRound,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isStudent, isTeacher, isApproved, isAdmin } = useAuth();

  const mainLinks = isStudent
    ? [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/available-tests', label: 'Available Tests', icon: FileCheck2 },
        { to: '/student/history', label: 'Test History', icon: History },
        { to: '/student/report-card', label: 'My Report Card', icon: Award },
        { to: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
      ]
    : isTeacher
    ? !isApproved
      ? [{ to: '/teacher/pending-approval', label: 'Approval Status', icon: Clock }]
      : [
          { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/teacher/tests', label: 'My Tests', icon: FileCheck2 },
          { to: '/teacher/reports', label: 'Student Reports', icon: FileSpreadsheet },
          { to: '/teacher/create-test', label: 'Create Test (MCQ)', icon: PlusCircle },
          { to: '/teacher/create-reading-comprehension', label: 'Create Reading Comp', icon: BookOpen },
          { to: '/teacher/pdf-mcq', label: 'PDF → MCQ Extractor', icon: FileUp },
          { to: '/teacher/create-essay', label: 'Create Essay Test', icon: FileEdit },
          { to: '/teacher/essays/evaluations', label: 'Essay Evaluations', icon: FileSpreadsheet },
          { to: '/teacher/analytics', label: 'Question Analytics', icon: BarChart3 },
        ]
    : [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
        { to: '/admin/password-resets', label: 'Password Resets', icon: KeyRound },
        { to: '/admin/reports', label: 'Student Reports', icon: FileSpreadsheet },
        { to: '/admin/users', label: 'Manage Users', icon: Users },
        { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
        { to: '/admin/tests', label: 'Manage Tests', icon: FileCheck2 },
        { to: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
      ];

  const infoLinks = [
    { to: '/about', label: 'About Platform', icon: Info },
    { to: '/about-developer', label: 'About Developer', icon: Code2 },
    { to: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-56 bg-[var(--bg-card)] border-r border-[var(--border)] transition-transform duration-200 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:top-14 sm:lg:top-16 lg:h-[calc(100vh-3.5rem)] sm:lg:h-[calc(100vh-4rem)] lg:z-30 flex flex-col`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="h-14 px-4 border-b border-[var(--border)] flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-7 h-7 rounded-lg bg-[#FA8128] text-white flex items-center justify-center font-black">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-[var(--text-main)]">
              Assessify
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-sub)] hover:text-[var(--text-main)] rounded-md lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2.5 py-3 flex-1 overflow-y-auto space-y-4">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Main Navigation
            </div>
            {mainLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-[#FA8128]/15 text-[#FA8128] font-bold border-l-2 border-[#FA8128]'
                        : 'text-[var(--text-sub)] font-semibold hover:bg-[var(--bg-sub)] hover:text-[var(--text-main)]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Information Section */}
          <div className="space-y-0.5 pt-2 border-t border-[var(--border)]">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Information
            </div>
            {infoLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-[#FA8128]/15 text-[#FA8128] font-bold border-l-2 border-[#FA8128]'
                        : 'text-[var(--text-sub)] font-semibold hover:bg-[var(--bg-sub)] hover:text-[var(--text-main)]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Version Tag */}
        <div className="p-2.5 border-t border-[var(--border)]">
          <div className="px-2 py-1.5 bg-[var(--bg-sub)] rounded-xl text-center text-[10px] text-[var(--text-muted)] font-semibold border border-[var(--border)]">
            Assessify v1.0 • ChaiCode Design
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
