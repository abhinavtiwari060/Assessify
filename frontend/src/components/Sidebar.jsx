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
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isStudent, isTeacher, isApproved } = useAuth();

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
          { to: '/teacher/create-test', label: 'Create Test (MCQ)', icon: PlusCircle },
          { to: '/teacher/pdf-mcq', label: 'PDF → MCQ Extractor', icon: FileUp },
          { to: '/teacher/create-essay', label: 'Create Essay Test', icon: FileEdit },
          { to: '/teacher/essays/evaluations', label: 'Essay Evaluations', icon: FileSpreadsheet },
          { to: '/teacher/analytics', label: 'Question Analytics', icon: BarChart3 },
        ]
    : [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Compact Sidebar Container (width: 224px / w-56) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-10 flex flex-col`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
              Assessify
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-md lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2.5 py-3 flex-1 overflow-y-auto space-y-4">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold border-r-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
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
          <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold border-r-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
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
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Assessify v1.0 • Stable
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
