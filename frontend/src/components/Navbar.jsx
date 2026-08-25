import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  GraduationCap,
  LogOut,
  User,
  Menu,
  ChevronDown,
  Award,
  SlidersHorizontal,
  LayoutDashboard,
  BookOpen,
  Trophy,
  BarChart2,
  Sparkles,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin)
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">ADMIN</span>;
    if (isTeacher)
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">TEACHER</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">STUDENT</span>;
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border)] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section: Mobile Menu + Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-[var(--text-sub)] hover:bg-[var(--bg-sub)] hover:text-[var(--text-main)] rounded-xl lg:hidden transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F59E0B] text-[#0A0A0A] flex items-center justify-center font-black shadow-xs group-hover:bg-[#D97706] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-tight">
                  Assessify
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">
                  EdTech
                </span>
              </div>
            </Link>
          </div>

          {/* Center Section: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isStudent && (
              <>
                <Link
                  to="/student/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/student/dashboard')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/student/available-tests"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/student/available-tests')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tests</span>
                </Link>
                <Link
                  to="/student/history"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/student/history')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Results</span>
                </Link>
                <Link
                  to="/student/leaderboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/student/leaderboard')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}

            {isTeacher && (
              <>
                <Link
                  to="/teacher/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/teacher/dashboard')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/teacher/tests"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/teacher/tests')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>My Tests</span>
                </Link>
                <Link
                  to="/teacher/pdf-mcq"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/teacher/pdf-mcq')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>PDF to MCQ</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive('/admin/dashboard')
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sub)]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Master Console</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Section: Theme Toggle + User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-[var(--bg-sub)] transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-[#F59E0B] text-[#0A0A0A] flex items-center justify-center font-black text-xs sm:text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-main)] leading-tight truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="mt-0.5">{getRoleBadge()}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-3.5 py-2 border-b border-[var(--border)]">
                      <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to={
                        isStudent
                          ? '/student/profile'
                          : isTeacher
                          ? '/teacher/profile'
                          : '/admin/settings'
                      }
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[var(--text-main)] hover:bg-[var(--bg-sub)] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#F59E0B]" />
                      <span>My Profile</span>
                    </Link>

                    {isStudent && (
                      <Link
                        to="/student/report-card"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[var(--text-main)] hover:bg-[var(--bg-sub)] transition-colors"
                      >
                        <Award className="w-4 h-4 text-[#F59E0B]" />
                        <span>My Report Card</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[var(--text-main)] hover:bg-[var(--bg-sub)] transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-[#EF4444]" />
                        <span>Settings</span>
                      </Link>
                    )}

                    <div className="border-t border-[var(--border)] my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[#EF4444] hover:bg-[#EF4444]/10 text-left transition-colors font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-xl transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
