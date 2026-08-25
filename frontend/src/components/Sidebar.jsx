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
          { to: '/teacher/reports', label: 'Student Reports', icon: FileSpreadsheet },
          { to: '/teacher/create-test', label: 'Create Test (MCQ)', icon: PlusCircle },
          { to: '/teacher/pdf-mcq', label: 'PDF → MCQ Extractor', icon: FileUp },
          { to: '/teacher/create-essay', label: 'Create Essay Test', icon: FileEdit },
          { to: '/teacher/essays/evaluations', label: 'Essay Evaluations', icon: FileSpreadsheet },
          { to: '/teacher/analytics', label: 'Question Analytics', icon: BarChart3 },
        ]
    : [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
          className="fixed inset-0 z-40 bg-[#0D1117]/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Compact Sidebar Container (width: 224px / w-56) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-[#161B22] border-r border-[#30363D] transition-transform duration-200 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-10 flex flex-col`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="h-14 px-4 border-b border-[#30363D] flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-7 h-7 rounded-lg bg-[#58A6FF] text-[#0D1117] flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-[#F0F6FC]">
              Assessify
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-[#8B949E] hover:text-[#F0F6FC] rounded-md lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2.5 py-3 flex-1 overflow-y-auto space-y-4">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
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
                    `flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-[#21262D] text-[#58A6FF] font-bold border-l-2 border-[#58A6FF]'
                        : 'text-[#8B949E] font-medium hover:bg-[#21262D] hover:text-[#F0F6FC]'
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
          <div className="space-y-0.5 pt-2 border-t border-[#30363D]">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
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
                    `flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-[#21262D] text-[#58A6FF] font-bold border-l-2 border-[#58A6FF]'
                        : 'text-[#8B949E] font-medium hover:bg-[#21262D] hover:text-[#F0F6FC]'
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
        <div className="p-2.5 border-t border-[#30363D]">
          <div className="px-2 py-1.5 bg-[#21262D] rounded-lg text-center text-[10px] text-[#8B949E] font-semibold border border-[#30363D]">
            Assessify v1.0 • Dark Developer
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
