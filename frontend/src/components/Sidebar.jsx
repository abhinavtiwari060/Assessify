import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  FileEdit,
  History,
  Trophy,
  Award,
  User,
  PlusCircle,
  FileUp,
  GraduationCap,
  Users,
  BookOpen,
  SlidersHorizontal,
  BarChart3,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { isStudent, isTeacher, isAdmin } = useAuth();

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/available-tests', label: 'Available Tests', icon: FileCheck2 },
    { to: '/student/history', label: 'Test History', icon: History },
    { to: '/student/report-card', label: 'My Report Card', icon: Award },
    { to: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/student/profile', label: 'Profile', icon: User },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/tests', label: 'My Tests', icon: FileCheck2 },
    { to: '/teacher/create-test', label: 'Create Test (MCQ)', icon: PlusCircle },
    { to: '/teacher/pdf-mcq', label: 'PDF → MCQ Extractor', icon: FileUp },
    { to: '/teacher/create-essay', label: 'Create Essay Test', icon: FileEdit },
    { to: '/teacher/essays/evaluations', label: 'Essay Evaluations', icon: FileSpreadsheet },
    { to: '/teacher/analytics', label: 'Question Analytics', icon: BarChart3 },
    { to: '/teacher/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/tests', label: 'Manage Tests', icon: FileCheck2 },
    { to: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  const links = isStudent ? studentLinks : isTeacher ? teacherLinks : adminLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-10 flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <span className="font-bold text-slate-900 dark:text-white">Navigation</span>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-6 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isStudent ? 'Student Portal' : isTeacher ? 'Teacher Portal' : 'Admin Portal'}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Assessify Platform v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
