import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { BarChart3, ShieldAlert, Activity } from 'lucide-react';

const PlatformAnalytics = () => {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/admin/audit-logs${actionFilter ? `?action=${actionFilter}` : ''}`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-500" />
            System Audit & Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit log of system actions (logins, test submissions, anti-cheating tab violations, evaluations).
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white shadow-sm"
        >
          <option value="">All Audit Actions</option>
          <option value="USER_LOGIN">User Logins</option>
          <option value="TEST_STARTED">Test Starts</option>
          <option value="TEST_SUBMITTED">Test Submissions</option>
          <option value="TAB_VIOLATION">Tab Switch Violations</option>
          <option value="ESSAY_SUBMITTED">Essay Submissions</option>
          <option value="ESSAY_EVALUATED">Essay Evaluations</option>
          <option value="PDF_MCQ_EXTRACT">PDF Extractions</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs found" description="Activity events will be recorded here automatically." />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Action Event</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold">
                      {log.userRole}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        log.action === 'TAB_VIOLATION'
                          ? 'bg-rose-500/20 text-rose-500'
                          : log.action.includes('SUBMITTED')
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-indigo-500/20 text-indigo-500'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-sans max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAnalytics;
