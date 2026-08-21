import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  GraduationCap,
  FileCheck2,
  BookOpen,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/admin');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/30 text-[11px] font-medium text-rose-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform Administration Portal
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Master Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-300 font-normal">
          Manage system users, teachers, subjects, test moderation, audit logs, and platform analytics.
        </p>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Students</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.totalStudents || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Teachers</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.totalTeachers || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tests</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.totalTests || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Subjects</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {analytics?.totalSubjects || 0}
          </div>
        </div>
      </div>

      {/* Admin Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Manage Users</h3>
            <p className="text-xs text-slate-500 font-normal">Promote roles & toggle active status</p>
          </div>
        </Link>

        <Link
          to="/admin/subjects"
          className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Manage Subjects</h3>
            <p className="text-xs text-slate-500 font-normal">Create & manage subjects</p>
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Platform Audit Trail</h3>
            <p className="text-xs text-slate-500 font-normal">View real-time event audit logs</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
