import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Check,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'student', 'teacher', 'pending'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Delete Confirmation
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading state for individual approval buttons
  const [approvingId, setApprovingId] = useState(null);

  const fetchUsers = async () => {
    try {
      let endpoint = '/admin/users';
      if (activeTab === 'pending') {
        endpoint = '/admin/teachers/pending';
      } else if (activeTab === 'student') {
        endpoint = '/admin/users?role=student';
      } else if (activeTab === 'teacher') {
        endpoint = '/admin/teachers';
      }

      const res = await api.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      addToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [activeTab]);

  const handleApproveTeacher = async (teacherId) => {
    setApprovingId(teacherId);
    try {
      await api.patch(`/admin/teachers/${teacherId}/approve`);
      addToast('Teacher approved successfully.', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to approve teacher', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const res = await api.delete(`/admin/users/${userToDelete._id}`);
      addToast(res.data?.message || 'User deleted successfully.', 'success');
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      addToast(`Updated user role to ${newRole.toUpperCase()}`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`);
      addToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return u.role === 'teacher' && u.isApproved === false;
    }
    return true;
  });

  const pendingTeachersCount = users.filter(
    (u) => u.role === 'teacher' && u.isApproved === false
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            User Account Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Approve teacher registrations, manage student & teacher roles, and moderate platform accounts.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold shadow-xs ${
              pendingTeachersCount > 0
                ? 'bg-[#FA8128]/10 border-[#FA8128]/30 text-[#FA8128]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {pendingTeachersCount > 0 ? (
              <>
                <Clock className="w-4 h-4 text-[#FA8128] animate-pulse" />
                <span>Pending Teacher Approvals: {pendingTeachersCount}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No pending teacher approvals.</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-4 sm:p-5 border border-[var(--border)] shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Users', icon: Users },
            { id: 'student', label: 'Students', icon: UserCheck },
            { id: 'teacher', label: 'Teachers', icon: CheckCircle },
            { id: 'pending', label: 'Pending Approvals', icon: Clock, count: pendingTeachersCount },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#FA8128] text-white shadow-md'
                    : 'bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] text-[var(--text-sub)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white text-[#FA8128]' : 'bg-[#FA8128] text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title={activeTab === 'pending' ? 'No pending teacher approvals' : 'No users found'}
          description={
            activeTab === 'pending'
              ? 'All registered teacher accounts have been reviewed and approved.'
              : 'Try adjusting your search query or switching tabs.'
          }
        />
      ) : (
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-sub)] text-xs uppercase text-[var(--text-muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map((u) => {
                  const isPending = u.role === 'teacher' && u.isApproved === false;
                  const isSelf = currentUser && currentUser._id === u._id;

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#FA8128] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-[#FA8128]/15 text-[#FA8128] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-sub)]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={isSelf}
                          className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs font-bold text-[var(--text-main)] cursor-pointer disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="px-6 py-4">
                        {u.role === 'teacher' ? (
                          isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FA8128]/10 border border-[#FA8128]/30 text-[#FA8128]">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Approved
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--bg-sub)] text-[var(--text-sub)]">
                            Approved
                          </span>
                        )}
                      </td>

                      {/* Active/Inactive Status Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          disabled={isSelf}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                            u.isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button for Pending Teacher */}
                          {isPending && (
                            <button
                              onClick={() => handleApproveTeacher(u._id)}
                              disabled={approvingId === u._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {approvingId === u._id ? 'Approving...' : 'Approve'}
                            </button>
                          )}

                          {/* Delete Button */}
                          {!isSelf ? (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isPending ? 'Reject / Delete' : 'Delete'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Self</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => !isDeleting && setUserToDelete(null)}
        title="Confirm Account Deletion"
        footer={
          <>
            <button
              onClick={() => setUserToDelete(null)}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="text-xs font-semibold">
              Warning: This action will permanently remove this user account from the system.
            </p>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {userToDelete?.role === 'teacher' && userToDelete?.isApproved === false
              ? 'Are you sure you want to delete this teacher?'
              : `Are you sure you want to delete the ${userToDelete?.role} account for ${userToDelete?.name} (${userToDelete?.email})?`}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsers;
