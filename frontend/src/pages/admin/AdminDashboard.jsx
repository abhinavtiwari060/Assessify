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
      {/* Banner - Solid Dark Developer Surface */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262D] border border-[#30363D] text-xs font-bold text-[#F85149]">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform Administration Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F0F6FC] tracking-tight">System Master Dashboard</h1>
        <p className="text-xs sm:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
          Manage system users, teacher approvals, password reset requests, subjects, test moderation, and platform audit logs.
        </p>
      </div>

      {/* Pending Approvals Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-[#D29922]/10 border border-[#D29922]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#D29922]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#21262D] text-[#D29922] border border-[#D29922]/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#F0F6FC]">
                Pending Teacher Approvals ({pendingCount})
              </div>
              <div className="text-xs text-[#8B949E] font-normal">
                {pendingCount} teacher registration{pendingCount > 1 ? 's are' : ' is'} waiting for administrator approval.
              </div>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-[#D29922] hover:bg-[#b8831b] text-[#0D1117] text-xs font-extrabold rounded-xl shadow-xs transition-all shrink-0"
          >
            Review Pending Accounts
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Total Users</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] text-[#58A6FF] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">{stats.totalUsers}</div>
          <div className="text-xs text-[#8B949E] font-normal">
            Students: {stats.totalStudents} | Teachers: {stats.totalTeachers}
          </div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Teacher Approvals</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] text-[#D29922] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">{stats.pendingTeachers}</div>
          <div className="text-xs text-[#8B949E] font-normal">Pending approval queue</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Subjects</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] text-[#3FB950] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">{stats.totalSubjects}</div>
          <div className="text-xs text-[#8B949E] font-normal">Configured subject domains</div>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Password Resets</span>
            <div className="w-10 h-10 rounded-xl bg-[#21262D] border border-[#30363D] text-[#F85149] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#F0F6FC]">
            Queue
          </div>
          <Link to="/admin/password-resets" className="text-xs font-semibold text-[#58A6FF] hover:underline">
            Manage Password Resets →
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#21262D] border border-[#30363D] text-[#58A6FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[#F0F6FC] text-sm sm:text-base">User Management</h3>
            <p className="text-xs text-[#8B949E] font-normal">Approve & manage accounts</p>
          </div>
        </Link>

        <Link
          to="/admin/subjects"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#21262D] border border-[#30363D] text-[#3FB950] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[#F0F6FC] text-sm sm:text-base">Manage Subjects</h3>
            <p className="text-xs text-[#8B949E] font-normal">Create & manage subjects</p>
          </div>
        </Link>

        <Link
          to="/admin/password-resets"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#21262D] border border-[#30363D] text-[#F85149] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <KeyRound className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[#F0F6FC] text-sm sm:text-base">Password Resets</h3>
            <p className="text-xs text-[#8B949E] font-normal">Review user reset requests</p>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-[#161B22] rounded-2xl p-5 border border-[#30363D] shadow-xs hover:border-[#58A6FF]/50 transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#21262D] border border-[#30363D] text-[#D29922] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-[#F0F6FC] text-sm sm:text-base">Audit Trail</h3>
            <p className="text-xs text-[#8B949E] font-normal">View event audit logs</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
