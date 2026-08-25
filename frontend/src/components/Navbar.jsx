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
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30">ADMIN</span>;
    if (isTeacher)
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30">TEACHER</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30">STUDENT</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#161B22] border-b border-[#30363D] transition-colors shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section: Mobile Menu + Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC] rounded-lg lg:hidden transition-colors"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#58A6FF] text-[#0D1117] flex items-center justify-center font-bold shadow-xs group-hover:bg-[#388BFD] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-[#F0F6FC] tracking-tight">
                  Assessify
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#8B949E]">
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
              className="p-2 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC] rounded-xl transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#D29922]" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B949E]" />
              )}
            </button>

            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-[#21262D] transition-colors"
                >
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-[#58A6FF] text-[#0D1117] flex items-center justify-center font-black text-xs sm:text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-bold text-[#F0F6FC] leading-tight truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="mt-0.5">{getRoleBadge()}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B949E] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl bg-[#161B22] border border-[#30363D] shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
                    <div className="px-3.5 py-2 border-b border-[#30363D]">
                      <p className="text-xs sm:text-sm font-bold text-[#F0F6FC] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#8B949E] truncate">
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
                      className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#58A6FF]" />
                      <span>My Profile</span>
                    </Link>

                    {isStudent && (
                      <Link
                        to="/student/report-card"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
                      >
                        <Award className="w-4 h-4 text-[#D29922]" />
                        <span>My Report Card</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-[#F85149]" />
                        <span>Settings</span>
                      </Link>
                    )}

                    <div className="border-t border-[#30363D] my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm text-[#F85149] hover:bg-[#F85149]/10 text-left transition-colors font-bold"
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
                  className="px-3 py-1.5 text-xs font-bold text-[#F0F6FC] bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] rounded-lg transition-colors"
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
