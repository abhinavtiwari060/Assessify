import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
  ChevronDown,
  Award,
  SlidersHorizontal,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
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
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">ADMIN</span>;
    if (isTeacher)
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">TEACHER</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">STUDENT</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section: Mobile Menu + Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Assessify
                </span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Right Section: Theme Toggle + User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Toggle dark / light theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              )}
            </button>

            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="mt-0.5">{getRoleBadge()}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700/80">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
                      className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>My Profile</span>
                    </Link>

                    {isStudent && (
                      <Link
                        to="/student/report-card"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>My Report Card</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                        <span>Settings</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-700/80 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors font-medium"
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
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
