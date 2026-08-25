import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  BookOpen,
  FileCheck2,
  BarChart3,
  ShieldCheck,
  Clock,
  KeyRound,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
    totalSubjects: 0,
    totalTests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersRes, pendingRes, subRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/teachers/pending'),
          api.get('/subjects'),
        ]);

        const users = usersRes.data || [];
        const pending = pendingRes.data || [];
        const subjects = subRes.data || [];

        const students = users.filter((u) => u.role === 'student').length;
        const teachers = users.filter((u) => u.role === 'teacher').length;

        setStats({
          totalUsers: users.length,
          totalStudents: students,
          totalTeachers: teachers,
          pendingTeachers: pending.length,
          totalSubjects: subjects.length,
          totalTests: 0,
        });
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) return <CardSkeleton />;

  const pendingCount = stats.pendingTeachers;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner - Theme Adaptive Surface */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FA8128]/15 border border-[#FA8128]/30 text-xs font-bold text-[#FA8128]">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform Administration Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">System Master Dashboard</h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-2xl leading-relaxed">
          Manage system users, teacher approvals, password reset requests, subjects, test moderation, and platform audit logs.
        </p>
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-[#FA8128]/10 border border-[#FA8128]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#FA8128]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[var(--text-main)]">
                Pending Teacher Approvals ({pendingCount})
              </div>
              <div className="text-xs text-[var(--text-sub)] font-normal">
                {pendingCount} teacher registration{pendingCount > 1 ? 's are' : ' is'} waiting for administrator approval.
              </div>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-[#FA8128] hover:bg-[#E06D1A] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Review Pending Accounts
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Users</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">{stats.totalUsers}</div>
          <div className="text-xs text-[var(--text-sub)] font-normal">
            Students: {stats.totalStudents} | Teachers: {stats.totalTeachers}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Teacher Approvals</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">{stats.pendingTeachers}</div>
          <div className="text-xs text-[var(--text-sub)] font-normal">Pending approval queue</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Subjects</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#22C55E] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">{stats.totalSubjects}</div>
          <div className="text-xs text-[var(--text-sub)] font-normal">Configured subject domains</div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Password Resets</span>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)]">
            Queue
          </div>
          <Link to="/admin/password-resets" className="text-xs font-semibold text-[#FA8128] hover:underline">
            Manage Password Resets →
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base">User Management</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">Approve & manage accounts</p>
          </div>
        </Link>

        <Link
          to="/admin/subjects"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#22C55E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base">Manage Subjects</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">Create & manage subjects</p>
          </div>
        </Link>

        <Link
          to="/admin/password-resets"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <KeyRound className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base">Password Resets</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">Review user reset requests</p>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] shadow-xs hover:border-[#FA8128]/50 transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-sub)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base">Audit Trail</h3>
            <p className="text-xs text-[var(--text-sub)] font-normal">View event audit logs</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
